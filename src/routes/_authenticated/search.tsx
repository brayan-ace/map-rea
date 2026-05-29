import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { searchLeads, type Lead, type SearchResult } from "@/lib/leads.functions";
import { useAuth } from "@/lib/auth-context";
import {
  type SavedSearch,
  type SearchHistory,
  fetchSavedSearches,
  loadSavedCache,
  persistCache,
  saveSavedSearch,
  updateSavedResult,
  loadHistoryCache,
  persistHistoryCache,
  saveSearchHistory,
  fetchSearchHistory,
  saveCRMLead,
  type CRMLead,
} from "@/lib/user-data";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  MapPin,
  Search,
  MessageCircle,
  Phone,
  Mail,
  Star,
  Loader2,
  Globe2,
  RefreshCw,
  Bookmark,
  Sparkles,
  Eye,
  ChevronDown,
  FileText,
  Save,
} from "lucide-react";
import { exportLeadsToCSV } from "@/lib/csv-export";

export const Route = createFileRoute("/_authenticated/search")({
  component: SearchPage,
  validateSearch: (s: Record<string, unknown>) => ({
    q: typeof s.q === "string" ? (s.q as string) : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Find leads — Lead Finder" },
      { name: "description", content: "Search Google Maps for businesses without a website." },
    ],
  }),
});

const DEFAULT_MESSAGE = `Hi, I'm Jordan 👋

I came across [Business Name] online and noticed you don't have a website yet.

Having one would:

✅ Make new customers trust you instantly before they even call

✅ Keep your business working 24/7 even when you're closed

I actually went ahead and built one for you already.

If you can give me 5 minutes, I'd love to show you what it looks like.

If you like it — great, we can talk.

If you don't — no hard feelings, you'll never hear from me again. 🤝`;

const SEEN_KEY = "leadfinder.seen.v1";

function loadSeen(): Record<string, number> {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(localStorage.getItem(SEEN_KEY) ?? "{}");
  } catch {
    return {};
  }
}
function saveSeen(seen: Record<string, number>) {
  localStorage.setItem(SEEN_KEY, JSON.stringify(seen));
}

function buildWhatsAppLink(phone: string | null, businessName: string, template: string) {
  const text = template
    .replaceAll("[Business Name]", businessName)
    .replaceAll("{business}", businessName);
  const encoded = encodeURIComponent(text);
  if (phone) {
    const digits = phone.replace(/[^\d]/g, "");
    return `https://wa.me/${digits}?text=${encoded}`;
  }
  return `https://wa.me/?text=${encoded}`;
}

function SearchPage() {
  const { user } = useAuth();
  const search = Route.useSearch();
  const fetchLeads = useServerFn(searchLeads);

  const [location, setLocation] = useState("");
  const [keyword, setKeyword] = useState("");
  const [radius, setRadius] = useState(10);
  const [minRating, setMinRating] = useState(0);
  const [hasPhone, setHasPhone] = useState(false);
  const [businessTypes, setBusinessTypes] = useState<string[]>([]);
  const [message, setMessage] = useState(DEFAULT_MESSAGE);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [seen, setSeen] = useState<Record<string, number>>({});
  const [savedSearches, setSavedSearches] = useState<SavedSearch[]>([]);
  const [searchHistory, setSearchHistory] = useState<SearchHistory[]>([]);
  const [seenSnapshot, setSeenSnapshot] = useState<Record<string, number>>({});

  // Hydrate from query param
  useEffect(() => {
    if (!search.q) return;
    const p = new URLSearchParams(search.q);
    const loc = p.get("location") ?? "";
    const kw = p.get("keyword") ?? "";
    if (loc) setLocation(loc);
    if (kw) setKeyword(kw);
  }, [search.q]);

  useEffect(() => {
    setSeen(loadSeen());
    if (!user) return;
    setSavedSearches(loadSavedCache(user.uid));
    setSearchHistory(loadHistoryCache(user.uid));
    fetchSavedSearches(user.uid)
      .then(setSavedSearches)
      .catch(() => {});
    fetchSearchHistory(user.uid)
      .then(setSearchHistory)
      .catch(() => {});
  }, [user]);

  const mutation = useMutation<SearchResult, Error, void>({
    mutationFn: () =>
      fetchLeads({
        data: { location, radiusKm: radius, keyword, minRating, hasPhone, businessTypes },
      }),
    onSuccess: (data) => {
      const next = { ...loadSeen() };
      const now = Date.now();
      for (const l of data.leads) if (!next[l.id]) next[l.id] = now;
      saveSeen(next);
      setSeen(next);
      if (!user) return;

      // Auto-save to search history
      const historyEntry: SearchHistory = {
        id: crypto.randomUUID(),
        location,
        keyword,
        radius,
        minRating,
        hasPhone,
        businessTypes,
        searchedAt: Date.now(),
        result: data && !data.error ? data : undefined,
      };
      const nextHistory = [historyEntry, ...searchHistory];
      setSearchHistory(nextHistory);
      persistHistoryCache(user.uid, nextHistory);
      saveSearchHistory(user.uid, historyEntry).catch((err) => {
        console.error("Failed to save search history:", err);
      });

      setSavedSearches((prev) => {
        const updated = prev.map((s) => {
          if (
            s.location === location &&
            s.keyword === keyword &&
            s.radius === radius &&
            s.minRating === minRating &&
            s.hasPhone === hasPhone &&
            JSON.stringify(s.businessTypes) === JSON.stringify(businessTypes)
          ) {
            updateSavedResult(user.uid, s.id, data).catch(() => {});
            return { ...s, result: data };
          }
          return s;
        });
        if (updated.some((s, i) => s !== prev[i])) persistCache(user.uid, updated);
        return updated;
      });
    },
  });

  const runSearch = () => {
    if (!location.trim()) return;
    setSeenSnapshot(loadSeen());
    mutation.mutate();
  };

  // Auto-run when ?q=... is provided
  useEffect(() => {
    if (search.q && location && !mutation.data && !mutation.isPending) {
      runSearch();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location]);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    runSearch();
  };

  const saveCurrent = async () => {
    if (!location.trim() || !user) return;
    const name =
      window.prompt(
        "Name this saved search",
        keyword ? `${keyword} in ${location}` : `${location} (${radius}km)`,
      ) ?? "";
    if (!name.trim()) return;

    let result: SearchResult | undefined =
      mutation.data && !mutation.data.error ? mutation.data : undefined;
    if (!result) {
      try {
        result = await fetchLeads({ data: { location, radiusKm: radius, keyword } });
      } catch {
        /* save without */
      }
    }

    const entry: SavedSearch = {
      id: crypto.randomUUID(),
      name: name.trim(),
      location,
      keyword,
      radius,
      minRating,
      hasPhone,
      businessTypes,
      savedAt: Date.now(),
      result: result && !result.error ? result : undefined,
    };
    const next = [entry, ...savedSearches];
    setSavedSearches(next);
    persistCache(user.uid, next);
    saveSavedSearch(user.uid, entry).catch((err) => {
      console.error("Failed to save search:", err);
    });
  };

  const result = mutation.data;
  void seen;

  return (
    <div className="px-5 sm:px-8 lg:px-12 py-8 lg:py-12 max-w-[1400px] mx-auto pb-24">
      {/* Header */}
      <div className="mb-8">
        <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Search</p>
        <h1 className="mt-2 font-display text-[2.25rem] sm:text-5xl text-foreground leading-[0.95]">
          Scan a city for <span className="italic text-gradient">website-less businesses.</span>
        </h1>
      </div>

      {/* Search panel */}
      <div
        className="relative overflow-hidden rounded-3xl p-6 lg:p-8"
        style={{
          background: "var(--gradient-card)",
          border: "1px solid color-mix(in oklab, var(--primary) 22%, transparent)",
          boxShadow: "var(--shadow-elevated)",
        }}
      >
        <div className="absolute inset-0 map-bg opacity-25 pointer-events-none" />
        <div
          className="absolute -top-32 -left-32 w-96 h-96 rounded-full opacity-25 pointer-events-none"
          style={{ background: "var(--gradient-primary)", filter: "blur(100px)" }}
        />

        <form onSubmit={onSubmit} className="relative grid md:grid-cols-2 gap-5">
          <div className="space-y-2">
            <Label
              htmlFor="loc"
              className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground"
            >
              City / Location
            </Label>
            <div className="relative">
              <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="loc"
                placeholder="e.g. Lisbon, Portugal"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                required
                className="h-12 pl-10 bg-background/50 border-border/60 backdrop-blur focus-glow text-base"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label
              htmlFor="kw"
              className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground"
            >
              Business type{" "}
              <span className="normal-case text-muted-foreground/70 tracking-normal">
                (optional)
              </span>
            </Label>
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="kw"
                placeholder="leave blank for all"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                className="h-12 pl-10 bg-background/50 border-border/60 backdrop-blur focus-glow text-base"
              />
            </div>
          </div>

          {/* Filters */}
          <div className="space-y-3 md:col-span-2">
            <div className="space-y-2">
              <Label
                htmlFor="minRating"
                className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground"
              >
                Minimum Rating
              </Label>
              <div className="flex items-center">
                <span className="text-sm font-semibold tabular-nums">{minRating}</span>
                <input
                  type="range"
                  id="minRating"
                  min="0"
                  max="5"
                  step="0.5"
                  value={minRating}
                  onChange={(e) => setMinRating(parseFloat(e.target.value))}
                  className="w-24 h-1"
                />
              </div>
              <div className="flex justify-between text-[10px] text-muted-foreground/70 tabular-nums">
                <span>0</span>
                <span>2.5</span>
                <span>5</span>
              </div>
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="hasPhone"
                className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground"
              >
                Phone Number Required
              </Label>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="hasPhone"
                  checked={hasPhone}
                  onChange={(e) => setHasPhone(e.target.checked)}
                  className="h-4 w-4 text-primary"
                />
                <span className="text-sm font-medium">Only show businesses with phone numbers</span>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
                Search radius
              </Label>
              <span className="text-sm font-semibold tabular-nums px-3 py-1 rounded-full border border-border/60 bg-background/40">
                {radius} km
              </span>
            </div>
            <Slider
              value={[radius]}
              min={1}
              max={100}
              step={1}
              onValueChange={(v) => setRadius(v[0] ?? 10)}
            />
            <div className="flex justify-between text-[10px] text-muted-foreground/70 tabular-nums">
              <span>1km</span>
              <span>25</span>
              <span>50</span>
              <span>75</span>
              <span>100km</span>
            </div>
          </div>

          <div className="md:col-span-2">
            <button
              type="button"
              onClick={() => setShowAdvanced((s) => !s)}
              className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <ChevronDown
                className={`h-3.5 w-3.5 transition-transform ${showAdvanced ? "rotate-180" : ""}`}
              />
              {showAdvanced ? "Hide" : "Customize"} WhatsApp message template
            </button>
            {showAdvanced && (
              <div className="mt-3 space-y-2 animate-rise">
                <Textarea
                  rows={8}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="bg-background/50 border-border/60 backdrop-blur focus-glow font-mono text-[13px] leading-relaxed"
                />
                <p className="text-xs text-muted-foreground">
                  Use{" "}
                  <code className="text-accent px-1 py-0.5 rounded bg-accent/10">
                    [Business Name]
                  </code>{" "}
                  to insert business name.
                </p>
              </div>
            )}
          </div>

          <div className="md:col-span-2 flex flex-col sm:flex-row gap-2.5 pt-2">
            <Button
              type="submit"
              size="lg"
              disabled={mutation.isPending || !location.trim()}
              className="flex-1 h-12 text-base font-semibold border-0 transition-transform hover:scale-[1.01]"
              style={{ background: "var(--gradient-primary)", boxShadow: "var(--shadow-glow)" }}
            >
              {mutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Scanning Google Maps…
                </>
              ) : (
                <>
                  <Search className="w-4 h-4 mr-2" />
                  Find leads
                </>
              )}
            </Button>
            <Button
              type="button"
              size="lg"
              variant="outline"
              onClick={runSearch}
              disabled={mutation.isPending || !location.trim()}
              className="h-12 bg-background/40 border-border/60 hover:bg-background/60"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${mutation.isPending ? "animate-spin" : ""}`} />
              Refresh
            </Button>
            <Button
              type="button"
              size="lg"
              variant="outline"
              onClick={saveCurrent}
              disabled={!location.trim()}
              className="h-12 bg-background/40 border-border/60 hover:bg-background/60"
            >
              <Bookmark className="w-4 h-4 mr-2" />
              Save
            </Button>
          </div>
        </form>
      </div>

      {mutation.isPending && !result && (
        <div className="mt-6 rounded-3xl p-8 card-premium overflow-hidden relative">
          <div className="absolute inset-x-0 top-0 h-px shimmer" />
          <div className="flex items-center gap-3 text-muted-foreground">
            <Loader2 className="w-5 h-5 animate-spin text-primary" />
            <span>Scanning Google Maps for businesses…</span>
          </div>
        </div>
      )}

      {mutation.isError && (
        <div className="mt-6 rounded-2xl p-4 border border-destructive/40 bg-destructive/10">
          <p className="text-sm text-destructive-foreground">{mutation.error.message}</p>
        </div>
      )}
      {result?.error && (
        <div className="mt-6 rounded-2xl p-4 border border-destructive/40 bg-destructive/10">
          <p className="text-sm text-destructive-foreground">{result.error}</p>
        </div>
      )}

      {result && !result.error && (
        <Results
          result={result}
          message={message}
          previouslySeen={seenSnapshot}
          onRefresh={runSearch}
          refreshing={mutation.isPending}
        />
      )}
    </div>
  );
}

function Results({
  result,
  message,
  previouslySeen,
  onRefresh,
  refreshing,
}: {
  result: SearchResult;
  message: string;
  previouslySeen: Record<string, number>;
  onRefresh: () => void;
  refreshing: boolean;
}) {
  const { user } = useAuth();
  const sorted = useMemo(() => {
    const list = [...result.leads];
    list.sort((a, b) => {
      const aNew = previouslySeen[a.id] ? 1 : 0;
      const bNew = previouslySeen[b.id] ? 1 : 0;
      if (aNew !== bNew) return aNew - bNew;
      return (b.userRatingCount ?? 0) - (a.userRatingCount ?? 0);
    });
    return list;
  }, [result.leads, previouslySeen]);

  const newCount = sorted.filter((l) => !previouslySeen[l.id]).length;

  // CSV Export function
  const exportToCSV = () => {
    if (!result || result.leads.length === 0) return;
    exportLeadsToCSV(
      result.leads,
      `leads-${result.locationLabel.replace(/[^a-z0-9]/gi, "-").toLowerCase()}.csv`,
    );
  };

  return (
    <section className="mt-10 animate-rise">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <StatCard label="Leads" value={result.withoutWebsite} accent />
        <StatCard label="Scanned" value={result.totalScanned} />
        <StatCard
          label="Conversion"
          value={`${result.totalScanned > 0 ? Math.round((result.withoutWebsite / result.totalScanned) * 100) : 0}%`}
        />
        <StatCard label="New" value={newCount} highlight={newCount > 0} />
      </div>

      <div className="flex flex-wrap items-end justify-between gap-4 mb-5">
        <div>
          <h2 className="font-display text-3xl md:text-4xl text-foreground leading-tight">
            Leads near{" "}
            <span className="italic text-gradient">{result.locationLabel.split(",")[0]}</span>
          </h2>
          <p className="text-sm text-muted-foreground mt-1">{result.locationLabel}</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            size="sm"
            variant="outline"
            onClick={onRefresh}
            disabled={refreshing}
            className="bg-background/40 border-border/60"
          >
            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${refreshing ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button
            size="sm"
            onClick={exportToCSV}
            disabled={result.leads.length === 0}
            className="bg-background/40 border-border/60 hover:bg-background/60"
          >
            <FileText className="w-3.5 h-3.5 mr-1.5" />
            Export CSV
          </Button>
        </div>
      </div>

      {sorted.length === 0 ? (
        <div className="rounded-3xl p-12 text-center card-premium">
          <div className="mx-auto w-12 h-12 rounded-full bg-background/40 grid place-items-center mb-3">
            <Search className="w-5 h-5 text-muted-foreground" />
          </div>
          <p className="text-muted-foreground">
            No leads without a website found. Widen the radius or change the business type.
          </p>
        </div>
      ) : (
        <div className="grid gap-3">
          {sorted.map((lead, i) => (
            <div
              key={lead.id}
              className="animate-rise"
              style={{ animationDelay: `${Math.min(i * 30, 300)}ms` }}
            >
              <LeadCard
                lead={lead}
                message={message}
                isNew={!previouslySeen[lead.id]}
                firstSeenAt={previouslySeen[lead.id]}
                userId={user?.uid}
              />
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function StatCard({
  label,
  value,
  accent,
  highlight,
}: {
  label: string;
  value: number | string;
  accent?: boolean;
  highlight?: boolean;
}) {
  return (
    <div
      className="relative overflow-hidden rounded-2xl p-4 card-premium"
      style={
        accent
          ? {
              boxShadow: "var(--shadow-glow)",
              borderColor: "color-mix(in oklab, var(--primary) 35%, transparent)",
            }
          : highlight
            ? { borderColor: "color-mix(in oklab, var(--accent) 50%, transparent)" }
            : undefined
      }
    >
      {accent && (
        <div
          className="absolute inset-0 opacity-15 pointer-events-none"
          style={{ background: "var(--gradient-primary)" }}
        />
      )}
      <p className="relative text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
        {label}
      </p>
      <p className="relative font-display text-3xl text-foreground tabular-nums mt-1.5 leading-none">
        {value}
      </p>
    </div>
  );
}

function formatType(t?: string) {
  if (!t) return "";
  return t.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function LeadCard({
  lead,
  message,
  isNew,
  firstSeenAt,
  userId,
}: {
  lead: Lead;
  message: string;
  isNew: boolean;
  firstSeenAt?: number;
  userId?: string;
}) {
  const wa = buildWhatsAppLink(lead.phone, lead.name, message);
  const initials = lead.name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
  const primaryType = lead.types?.find((t) => !["point_of_interest", "establishment"].includes(t));
  const [showSaveMenu, setShowSaveMenu] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");

  const handleSaveToCRM = async () => {
    if (!userId) {
      setSaveMsg("Not authenticated");
      return;
    }
    setSaveMsg("Saving...");
    try {
      const crmLead: CRMLead = {
        id: lead.id,
        googlePlaceId: lead.id,
        name: lead.name,
        address: lead.address,
        phone: lead.phone,
        rating: lead.rating,
        userRatingCount: lead.userRatingCount,
        types: lead.types,
        mapsUrl: lead.mapsUrl,
        status: "new",
        tags: [],
        notes: "",
        outreachHistory: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      await saveCRMLead(userId, crmLead);
      setSaveMsg("✓ Saved to CRM");
      setTimeout(() => setSaveMsg(""), 2000);
    } catch (err) {
      console.error("Failed to save lead:", err);
      setSaveMsg("✗ Failed");
      setTimeout(() => setSaveMsg(""), 3000);
    }
  };

  return (
    <div
      className="group relative rounded-2xl p-5 transition-all duration-300 hover:-translate-y-0.5"
      style={{
        background: "var(--gradient-card)",
        border: `1px solid ${isNew ? "color-mix(in oklab, var(--primary) 50%, transparent)" : "color-mix(in oklab, var(--foreground) 8%, transparent)"}`,
        boxShadow: "var(--shadow-soft)",
      }}
    >
      {isNew && (
        <div
          className="absolute left-0 top-4 bottom-4 w-1 rounded-r-full"
          style={{ background: "var(--gradient-primary)" }}
        />
      )}
      <div className="flex flex-col gap-4">
        {/* Header with info */}
        <div className="flex gap-4">
          <div
            className="hidden sm:grid w-12 h-12 rounded-xl place-items-center text-sm font-bold text-primary-foreground shrink-0"
            style={{ background: "var(--gradient-primary)", boxShadow: "var(--shadow-soft)" }}
          >
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-display text-xl text-foreground truncate">{lead.name}</h3>
              {isNew ? (
                <Badge
                  className="text-[10px] uppercase tracking-wider border-0"
                  style={{ background: "var(--gradient-primary)" }}
                >
                  <Sparkles className="w-3 h-3 mr-1" /> New
                </Badge>
              ) : (
                <Badge
                  variant="secondary"
                  className="text-[10px] uppercase tracking-wider"
                  title={
                    firstSeenAt
                      ? `First seen ${new Date(firstSeenAt).toLocaleDateString()}`
                      : undefined
                  }
                >
                  <Eye className="w-3 h-3 mr-1" /> Seen
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-3 mt-1.5 text-sm text-muted-foreground flex-wrap">
              {lead.rating !== null && (
                <span className="inline-flex items-center gap-1">
                  <Star className="w-3.5 h-3.5 fill-accent text-accent" />
                  <span className="font-medium text-foreground">{lead.rating.toFixed(1)}</span>
                  <span className="text-xs">({lead.userRatingCount ?? 0})</span>
                </span>
              )}
              {primaryType && (
                <span className="text-xs px-2 py-0.5 rounded-md border border-border/60 bg-background/40">
                  {formatType(primaryType)}
                </span>
              )}
            </div>
            <p className="text-sm text-muted-foreground mt-1.5">{lead.address}</p>
            <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground flex-wrap">
              {lead.phone ? (
                <span className="inline-flex items-center gap-1">
                  <Phone className="w-3 h-3" />
                  <span className="tabular-nums">{lead.phone}</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 opacity-60">
                  <Phone className="w-3 h-3" />
                  no phone listed
                </span>
              )}
              <a
                href={lead.mapsUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 hover:text-foreground transition-colors"
              >
                <Globe2 className="w-3 h-3" />
                View on Maps
              </a>
            </div>
          </div>
        </div>

        {/* Action buttons - Beautiful grid layout */}
        <div className="flex flex-col sm:flex-row gap-2.5 pt-2 border-t border-border/20">
          {/* WhatsApp Button */}
          <Button
            asChild={!!lead.phone}
            className="flex-1 h-10 border-0 font-semibold transition-all"
            style={{
              background: lead.phone
                ? "linear-gradient(135deg, #10b981 0%, #059669 100%)"
                : undefined,
              boxShadow: lead.phone ? "0 4px 12px rgba(16, 185, 129, 0.2)" : undefined,
            }}
            disabled={!lead.phone}
          >
            {lead.phone ? (
              <a
                href={wa}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-center gap-2"
              >
                <MessageCircle className="w-4 h-4" />
                <span>WhatsApp</span>
              </a>
            ) : (
              <span className="flex items-center justify-center gap-2">
                <MessageCircle className="w-4 h-4" />
                <span>No phone</span>
              </span>
            )}
          </Button>

          {/* Phone Call Button */}
          {lead.phone && (
            <a
              href={`tel:${lead.phone}`}
              className="flex-1 h-10 rounded-lg border border-border/60 bg-blue-50 hover:bg-blue-100 text-blue-600 font-semibold transition-all flex items-center justify-center gap-2"
              title="Call this business"
            >
              <Phone className="w-4 h-4" />
              <span>Call</span>
            </a>
          )}

          {/* Email Button */}
          <a
            href={`mailto:?subject=${encodeURIComponent(`Your ${lead.name} Website`)}&body=${encodeURIComponent(`Hi ${lead.name},\n\nI noticed you don't have a website yet...`)}`}
            className="flex-1 h-10 rounded-lg border border-border/60 bg-purple-50 hover:bg-purple-100 text-purple-600 font-semibold transition-all flex items-center justify-center gap-2"
            title="Send email"
          >
            <Mail className="w-4 h-4" />
            <span>Email</span>
          </a>

          {/* Save to CRM Button */}
          <div className="relative flex-1">
            <Button
              onClick={handleSaveToCRM}
              className="w-full h-10 border border-border/60 bg-amber-50 hover:bg-amber-100 text-amber-600 font-semibold transition-all"
              disabled={saveMsg.includes("Saving")}
            >
              <Save className="w-4 h-4 mr-2" />
              {saveMsg || "Save"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
