import type { CRMLead } from "./user-data";
import type { Lead, SearchResult } from "./leads.functions";

export function exportLeadsToCSV(leads: CRMLead[] | Lead[], filename: string = "leads.csv"): void {
  // Check if it's CRM leads or regular leads
  const isCRMLead = (lead: any): lead is CRMLead => "status" in lead;

  let csv = "";

  if (leads.length > 0 && isCRMLead(leads[0])) {
    // CRM Leads CSV
    const crmLeads = leads as CRMLead[];
    csv = [
      "Business Name,Address,Phone,Rating,Review Count,Status,Tags,Notes,Contacted At,Last Outreach",
      ...crmLeads.map((lead) => {
        const lastOutreach = lead.outreachHistory[lead.outreachHistory.length - 1]?.timestamp;
        const contactedAt = lead.outreachHistory[0]?.timestamp;

        return [
          `"${lead.name.replace(/"/g, '""')}"`,
          `"${lead.address.replace(/"/g, '""')}"`,
          lead.phone ? `"${lead.phone}"` : "",
          lead.rating || "",
          lead.userRatingCount || "",
          lead.status,
          `"${lead.tags.join("; ")}"`,
          `"${lead.notes.replace(/"/g, '""')}"`,
          contactedAt ? new Date(contactedAt).toLocaleDateString() : "",
          lastOutreach ? new Date(lastOutreach).toLocaleDateString() : "",
        ].join(",");
      }),
    ].join("\n");
  } else {
    // Regular Leads CSV
    const regularLeads = leads as Lead[];
    csv = [
      "Business Name,Address,Phone,Rating,Review Count,Type,Google Maps URL",
      ...regularLeads.map((lead) => {
        return [
          `"${lead.name.replace(/"/g, '""')}"`,
          `"${lead.address.replace(/"/g, '""')}"`,
          lead.phone ? `"${lead.phone}"` : "",
          lead.rating || "",
          lead.userRatingCount || "",
          `"${lead.types.join("; ")}"`,
          lead.mapsUrl,
        ].join(",");
      }),
    ].join("\n");
  }

  // Create blob and download
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);

  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  link.style.visibility = "hidden";

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function exportSearchResultToCSV(result: SearchResult, location: string): void {
  const timestamp = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const filename = `leads_${location.replace(/[^a-z0-9]/gi, "_")}_${timestamp}.csv`;
  exportLeadsToCSV(result.leads, filename);
}

export function exportAnalyticsToCSV(
  searchHistory: any[],
  crmLeads: CRMLead[],
  filename: string = "analytics.csv",
): void {
  // Summary stats
  const totalSearches = searchHistory.length;
  const totalLeadsFound = searchHistory.reduce(
    (sum, s) => sum + (s.result?.withoutWebsite || 0),
    0,
  );
  const totalContacted = crmLeads.filter((l) => l.status !== "new").length;
  const totalConverted = crmLeads.filter((l) => l.status === "converted").length;

  const csv = [
    "Analytics Export",
    `Generated: ${new Date().toLocaleString()}`,
    "",
    "SUMMARY",
    `Total Searches,${totalSearches}`,
    `Total Leads Found,${totalLeadsFound}`,
    `Total Leads Contacted,${totalContacted}`,
    `Total Conversions,${totalConverted}`,
    `Contact Rate,${totalLeadsFound > 0 ? ((totalContacted / totalLeadsFound) * 100).toFixed(2) : 0}%`,
    `Conversion Rate,${totalContacted > 0 ? ((totalConverted / totalContacted) * 100).toFixed(2) : 0}%`,
    "",
    "LEADS BY STATUS",
    "Status,Count",
    ...Object.entries(
      crmLeads.reduce(
        (acc, lead) => {
          acc[lead.status] = (acc[lead.status] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>,
      ),
    ).map(([status, count]) => `${status},${count}`),
    "",
    "SEARCHES",
    "Location,Keyword,Radius (km),Leads Found,Date",
    ...searchHistory.map((s) => {
      const date = new Date(s.searchedAt).toLocaleDateString();
      return `"${s.location}","${s.keyword}",${s.radius},${s.result?.withoutWebsite || 0},${date}`;
    }),
  ].join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);

  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  link.style.visibility = "hidden";

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
