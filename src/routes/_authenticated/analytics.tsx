import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useMemo } from "react";
import { useAuth } from "@/lib/auth-context";
import {
  type SearchHistory,
  fetchSearchHistory,
  type CRMLead,
  fetchCRMLeads,
} from "@/lib/user-data";
import {
  PieChart,
  Pie,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { Button } from "@/components/ui/button";
import { TrendingUp, Download, Calendar, Target, Users } from "lucide-react";

export const Route = createFileRoute("/_authenticated/analytics")({
  component: AnalyticsPage,
  head: () => ({
    meta: [
      { title: "Analytics — Lead Finder" },
      { name: "description", content: "View your lead generation analytics and insights." },
    ],
  }),
});

function AnalyticsPage() {
  const { user } = useAuth();
  const [searchHistory, setSearchHistory] = useState<SearchHistory[]>([]);
  const [leads, setLeads] = useState<CRMLead[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    loadData();
  }, [user]);

  const loadData = async () => {
    if (!user) return;
    setLoading(true);
    const [history, crmLeads] = await Promise.all([
      fetchSearchHistory(user.uid),
      fetchCRMLeads(user.uid),
    ]);
    setSearchHistory(history);
    setLeads(crmLeads);
    setLoading(false);
  };

  const analytics = useMemo(() => {
    const stats = {
      totalSearches: searchHistory.length,
      totalLeadsFound: 0,
      totalLeadsContacted: 0,
      totalConverted: 0,
      avgLeadsPerSearch: 0,
      contactRate: 0,
      conversionRate: 0,
      topLocations: [] as { name: string; count: number }[],
      leadsPerDay: [] as { date: string; leads: number }[],
      statusDistribution: [] as { name: string; value: number }[],
      outreachMethods: { phone: 0, whatsapp: 0, email: 0 },
    };

    // Calculate leads stats
    searchHistory.forEach((search) => {
      if (search.result?.withoutWebsite) {
        stats.totalLeadsFound += search.result.withoutWebsite;
      }
    });

    // Leads by location
    const locationMap = new Map<string, number>();
    searchHistory.forEach((search) => {
      const location = search.location.split(",")[0];
      locationMap.set(location, (locationMap.get(location) || 0) + 1);
    });
    stats.topLocations = Array.from(locationMap.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Contact and conversion stats
    stats.totalLeadsContacted = leads.filter((l) => l.status !== "new").length;
    stats.totalConverted = leads.filter((l) => l.status === "converted").length;

    if (stats.totalLeadsFound > 0) {
      stats.avgLeadsPerSearch = stats.totalLeadsFound / stats.totalSearches;
      stats.contactRate = (stats.totalLeadsContacted / stats.totalLeadsFound) * 100;
    }

    if (stats.totalLeadsContacted > 0) {
      stats.conversionRate = (stats.totalConverted / stats.totalLeadsContacted) * 100;
    }

    // Status distribution
    const statusMap = new Map<string, number>();
    leads.forEach((lead) => {
      statusMap.set(lead.status, (statusMap.get(lead.status) || 0) + 1);
    });
    stats.statusDistribution = Array.from(statusMap.entries()).map(([name, value]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      value,
    }));

    // Outreach methods
    leads.forEach((lead) => {
      lead.outreachHistory.forEach((log) => {
        stats.outreachMethods[log.method]++;
      });
    });

    // Leads per day (last 30 days)
    const dayMap = new Map<string, number>();
    leads.forEach((lead) => {
      const date = new Date(lead.createdAt).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });
      dayMap.set(date, (dayMap.get(date) || 0) + 1);
    });
    stats.leadsPerDay = Array.from(dayMap.entries())
      .map(([date, leads]) => ({ date, leads }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    return stats;
  }, [searchHistory, leads]);

  const statCards = [
    {
      title: "Total Searches",
      value: analytics.totalSearches,
      icon: Target,
      color: "from-blue-500/10 to-blue-500/5",
    },
    {
      title: "Leads Found",
      value: analytics.totalLeadsFound,
      icon: Users,
      color: "from-purple-500/10 to-purple-500/5",
    },
    {
      title: "Contact Rate",
      value: `${Math.round(analytics.contactRate)}%`,
      icon: TrendingUp,
      color: "from-green-500/10 to-green-500/5",
    },
    {
      title: "Conversion Rate",
      value: `${Math.round(analytics.conversionRate)}%`,
      icon: Download,
      color: "from-amber-500/10 to-amber-500/5",
    },
  ];

  const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="px-5 sm:px-8 lg:px-12 py-8 lg:py-12 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="mb-12 animate-rise">
        <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Analytics</p>
        <h1 className="mt-2 font-display text-[2.25rem] sm:text-5xl text-foreground leading-[0.95]">
          Performance & <span className="italic text-gradient">Insights</span>
        </h1>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8 animate-rise">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.title}
              className={`rounded-2xl p-6 border border-border/40 bg-gradient-to-br ${card.color}`}
            >
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs uppercase tracking-[0.15em] text-muted-foreground font-medium">
                  {card.title}
                </span>
                <Icon className="h-5 w-5 text-muted-foreground/60" />
              </div>
              <p className="text-3xl font-bold text-foreground">{card.value}</p>
            </div>
          );
        })}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6 animate-rise">
        {/* Status Distribution */}
        {analytics.statusDistribution.length > 0 && (
          <div className="rounded-2xl border border-border/40 bg-card p-6">
            <h2 className="text-lg font-semibold text-foreground mb-6">Lead Status Distribution</h2>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={analytics.statusDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {analytics.statusDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Top Locations */}
        {analytics.topLocations.length > 0 && (
          <div className="rounded-2xl border border-border/40 bg-card p-6">
            <h2 className="text-lg font-semibold text-foreground mb-6">Top Search Locations</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={analytics.topLocations}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="name" stroke="var(--muted-foreground)" />
                <YAxis stroke="var(--muted-foreground)" />
                <Tooltip
                  contentStyle={{ background: "var(--card)", border: "1px solid var(--border)" }}
                />
                <Bar dataKey="count" fill="#3b82f6" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Outreach Methods */}
      <div className="animate-rise rounded-2xl border border-border/40 bg-card p-6">
        <h2 className="text-lg font-semibold text-foreground mb-6">Outreach Method Usage</h2>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-4 rounded-lg bg-blue-50 border border-blue-200">
            <p className="text-sm text-blue-600 font-medium">Phone Calls</p>
            <p className="text-2xl font-bold text-blue-700 mt-2">
              {analytics.outreachMethods.phone}
            </p>
          </div>
          <div className="text-center p-4 rounded-lg bg-green-50 border border-green-200">
            <p className="text-sm text-green-600 font-medium">WhatsApp</p>
            <p className="text-2xl font-bold text-green-700 mt-2">
              {analytics.outreachMethods.whatsapp}
            </p>
          </div>
          <div className="text-center p-4 rounded-lg bg-purple-50 border border-purple-200">
            <p className="text-sm text-purple-600 font-medium">Email</p>
            <p className="text-2xl font-bold text-purple-700 mt-2">
              {analytics.outreachMethods.email}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
