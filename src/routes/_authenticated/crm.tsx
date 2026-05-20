import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useMemo } from "react";
import { useAuth } from "@/lib/auth-context";
import {
  type CRMLead,
  fetchCRMLeads,
  updateCRMLeadStatus,
  updateCRMLeadNotes,
  updateCRMLeadTags,
  getCRMLeadStats,
  deleteCRMLead,
  addOutreachLog,
} from "@/lib/user-data";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  MessageCircle,
  Phone,
  Mail,
  Trash2,
  Edit2,
  X,
  MapPin,
  Star,
  Activity,
  TrendingUp,
  Users,
  CheckCircle,
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/crm")({
  component: CRMPage,
  head: () => ({
    meta: [
      { title: "CRM Dashboard — Lead Finder" },
      { name: "description", content: "Manage and track your leads." },
    ],
  }),
});

type StatusFilter = "all" | "new" | "contacted" | "responded" | "converted" | "rejected";

const statusColors = {
  new: "bg-slate-100 text-slate-800",
  contacted: "bg-blue-100 text-blue-800",
  responded: "bg-amber-100 text-amber-800",
  converted: "bg-green-100 text-green-800",
  rejected: "bg-red-100 text-red-800",
};

const statusLabels = {
  new: "New",
  contacted: "Contacted",
  responded: "Responded",
  converted: "Converted",
  rejected: "Rejected",
};

function CRMPage() {
  const { user } = useAuth();
  const [leads, setLeads] = useState<CRMLead[]>([]);
  const [stats, setStats] = useState({ total: 0, byStatus: {}, contacted: 0, converted: 0 });
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editNotes, setEditNotes] = useState("");

  useEffect(() => {
    if (!user) return;
    loadLeads();
  }, [user]);

  const loadLeads = async () => {
    if (!user) return;
    const data = await fetchCRMLeads(user.uid);
    setLeads(data);
    const s = await getCRMLeadStats(user.uid);
    setStats(s);
  };

  const filteredLeads = useMemo(() => {
    return leads.filter((lead) => {
      if (statusFilter !== "all" && lead.status !== statusFilter) return false;
      if (searchTerm && !lead.name.toLowerCase().includes(searchTerm.toLowerCase())) return false;
      return true;
    });
  }, [leads, statusFilter, searchTerm]);

  const handleStatusChange = async (leadId: string, newStatus: CRMLead["status"]) => {
    if (!user) return;
    await updateCRMLeadStatus(user.uid, leadId, newStatus);
    setLeads(leads.map((l) => (l.id === leadId ? { ...l, status: newStatus } : l)));
  };

  const handleSaveNotes = async (leadId: string) => {
    if (!user) return;
    await updateCRMLeadNotes(user.uid, leadId, editNotes);
    setLeads(leads.map((l) => (l.id === leadId ? { ...l, notes: editNotes } : l)));
    setEditingId(null);
  };

  const handleDelete = async (leadId: string) => {
    if (!user || !confirm("Delete this lead?")) return;
    await deleteCRMLead(user.uid, leadId);
    setLeads(leads.filter((l) => l.id !== leadId));
  };

  const handleOutreach = async (leadId: string, method: "phone" | "whatsapp" | "email") => {
    if (!user) return;
    await addOutreachLog(user.uid, leadId, {
      timestamp: Date.now(),
      method,
      status: "sent",
    });
    // Also update status to 'contacted' if still 'new'
    const lead = leads.find((l) => l.id === leadId);
    if (lead && lead.status === "new") {
      await handleStatusChange(leadId, "contacted");
    }
    await loadLeads();
  };

  const statItems = [
    {
      label: "Total Leads",
      value: stats.total,
      icon: Users,
      color: "from-blue-500/10 to-blue-500/5",
    },
    {
      label: "Contacted",
      value: stats.contacted,
      icon: Activity,
      color: "from-amber-500/10 to-amber-500/5",
    },
    {
      label: "Converted",
      value: stats.converted,
      icon: CheckCircle,
      color: "from-green-500/10 to-green-500/5",
    },
    {
      label: "Conversion Rate",
      value: stats.total > 0 ? `${Math.round((stats.converted / stats.total) * 100)}%` : "0%",
      icon: TrendingUp,
      color: "from-purple-500/10 to-purple-500/5",
    },
  ];

  return (
    <div className="px-5 sm:px-8 lg:px-12 py-8 lg:py-12 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="mb-12 animate-rise">
        <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Dashboard</p>
        <h1 className="mt-2 font-display text-[2.25rem] sm:text-5xl text-foreground leading-[0.95]">
          Lead Management & <span className="italic text-gradient">CRM Dashboard</span>
        </h1>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8 animate-rise">
        {statItems.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.label}
              className={`rounded-2xl p-4 border border-border/40 bg-gradient-to-br ${item.color}`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs uppercase tracking-[0.15em] text-muted-foreground font-medium">
                  {item.label}
                </span>
                <Icon className="h-4 w-4 text-muted-foreground/60" />
              </div>
              <p className="text-2xl sm:text-3xl font-bold text-foreground">{item.value}</p>
            </div>
          );
        })}
      </div>

      {/* Filters */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4 animate-rise">
        <Input
          placeholder="Search leads by name..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="h-10 flex-1 bg-background/50 border-border/60"
        />
        <div className="flex gap-2 flex-wrap sm:flex-nowrap">
          {(
            ["all", "new", "contacted", "responded", "converted", "rejected"] as StatusFilter[]
          ).map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                statusFilter === status
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              {status === "all" ? "All" : statusLabels[status]}
            </button>
          ))}
        </div>
      </div>

      {/* Leads Table */}
      <div className="animate-rise rounded-2xl overflow-hidden border border-border/40 bg-card">
        {filteredLeads.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-center">
            <Activity className="h-12 w-12 text-muted-foreground/30 mb-4" />
            <p className="text-muted-foreground">No leads found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-border/40 bg-muted/30">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Business
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredLeads.map((lead) => (
                  <tr
                    key={lead.id}
                    className="border-b border-border/20 hover:bg-muted/30 transition-colors group"
                  >
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        <a
                          href={lead.mapsUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-semibold text-foreground hover:text-primary transition-colors"
                        >
                          {lead.name}
                        </a>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <MapPin className="h-3 w-3" />
                          {lead.address}
                        </div>
                        {lead.rating && (
                          <div className="flex items-center gap-1 text-xs">
                            <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                            <span className="text-foreground">{lead.rating}</span>
                            <span className="text-muted-foreground">({lead.userRatingCount})</span>
                          </div>
                        )}
                        {lead.tags.length > 0 && (
                          <div className="flex gap-1 flex-wrap mt-2">
                            {lead.tags.map((tag) => (
                              <Badge key={tag} variant="secondary" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        )}
                        {editingId === lead.id ? (
                          <div className="mt-3 space-y-2">
                            <Textarea
                              value={editNotes}
                              onChange={(e) => setEditNotes(e.target.value)}
                              placeholder="Add notes..."
                              className="h-20 resize-none text-sm"
                            />
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                onClick={() => handleSaveNotes(lead.id)}
                                className="h-8"
                              >
                                Save
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setEditingId(null)}
                                className="h-8"
                              >
                                Cancel
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div
                            className="mt-2 p-2 bg-muted/50 rounded text-sm text-foreground cursor-pointer hover:bg-muted transition-colors"
                            onClick={() => {
                              setEditingId(lead.id);
                              setEditNotes(lead.notes);
                            }}
                          >
                            {lead.notes || (
                              <span className="text-muted-foreground italic">Add notes...</span>
                            )}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-2">
                        {lead.phone && (
                          <a
                            href={`tel:${lead.phone}`}
                            className="text-sm text-primary hover:underline"
                          >
                            {lead.phone}
                          </a>
                        )}
                        <div className="flex gap-2">
                          {lead.phone && (
                            <button
                              onClick={() => handleOutreach(lead.id, "phone")}
                              className="p-2 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
                              title="Call"
                            >
                              <Phone className="h-4 w-4" />
                            </button>
                          )}
                          <button
                            onClick={() => handleOutreach(lead.id, "whatsapp")}
                            className="p-2 rounded-lg bg-green-50 text-green-600 hover:bg-green-100 transition-colors"
                            title="WhatsApp"
                          >
                            <MessageCircle className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleOutreach(lead.id, "email")}
                            className="p-2 rounded-lg bg-purple-50 text-purple-600 hover:bg-purple-100 transition-colors"
                            title="Email"
                          >
                            <Mail className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <select
                        value={lead.status}
                        onChange={(e) =>
                          handleStatusChange(lead.id, e.target.value as CRMLead["status"])
                        }
                        className={`px-3 py-2 rounded-lg text-sm font-medium border-0 cursor-pointer transition-colors ${
                          statusColors[lead.status]
                        }`}
                      >
                        {(Object.entries(statusLabels) as [CRMLead["status"], string][]).map(
                          ([val, label]) => (
                            <option key={val} value={val}>
                              {label}
                            </option>
                          ),
                        )}
                      </select>
                      {lead.outreachHistory.length > 0 && (
                        <div className="text-xs text-muted-foreground mt-2">
                          Contacted:{" "}
                          {new Date(
                            lead.outreachHistory[lead.outreachHistory.length - 1].timestamp,
                          ).toLocaleDateString()}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleDelete(lead.id)}
                        className="p-2 rounded-lg text-destructive hover:bg-destructive/10 transition-colors opacity-0 group-hover:opacity-100"
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
