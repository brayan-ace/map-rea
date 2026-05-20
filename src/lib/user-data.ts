import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import { getDb } from "./firebase";
import type { SearchResult } from "./leads.functions";

// Helper to sanitize objects for Firestore (convert undefined to null)
function sanitizeForFirestore(obj: any): any {
  if (obj === undefined) return null;
  if (obj === null || typeof obj !== "object") return obj;
  if (Array.isArray(obj)) return obj.map(sanitizeForFirestore);
  
  const sanitized: any = {};
  for (const key in obj) {
    const val = obj[key];
    if (val !== undefined) {
      sanitized[key] = sanitizeForFirestore(val);
    }
  }
  return sanitized;
}

export type SavedSearch = {
  id: string;
  name: string;
  location: string;
  keyword: string;
  radius: number;
  minRating?: number;
  hasPhone?: boolean;
  businessTypes?: string[];
  savedAt: number;
  result?: SearchResult;
};

const userDocRef = (uid: string) => doc(getDb(), "users", uid);
const savedColRef = (uid: string) => collection(getDb(), "users", uid, "savedSearches");
const savedDocRef = (uid: string, id: string) => doc(getDb(), "users", uid, "savedSearches", id);

// ---- Onboarding ----

export async function getOnboardingStatus(uid: string): Promise<{
  completed: boolean;
  profile?: Record<string, unknown>;
}> {
  const snap = await getDoc(userDocRef(uid));
  if (!snap.exists()) return { completed: false };
  const data = snap.data();
  return { completed: !!data.onboardingCompletedAt, profile: data };
}

export async function completeOnboarding(
  uid: string,
  data: {
    role?: string;
    goal?: string;
    region?: string;
    signature?: string;
    displayName?: string;
  },
) {
  await setDoc(
    userDocRef(uid),
    {
      ...data,
      onboardingCompletedAt: serverTimestamp(),
    },
    { merge: true },
  );
}

// ---- Saved searches (Firestore + localStorage cache) ----

const cacheKey = (uid: string) => `leadfinder.saved.v2.${uid}`;

export function loadSavedCache(uid: string): SavedSearch[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(cacheKey(uid)) ?? "[]");
  } catch {
    return [];
  }
}

function writeCache(uid: string, list: SavedSearch[]) {
  try {
    localStorage.setItem(cacheKey(uid), JSON.stringify(list));
  } catch {
    /* quota — ignore */
  }
}

export async function fetchSavedSearches(uid: string): Promise<SavedSearch[]> {
  try {
    const q = query(savedColRef(uid), orderBy("savedAt", "desc"));
    const snap = await getDocs(q);
    const list: SavedSearch[] = snap.docs.map((d) => {
      const data = d.data() as any;
      return {
        id: d.id,
        name: data.name,
        location: data.location,
        keyword: data.keyword ?? "",
        radius: data.radius ?? 10,
        minRating: data.minRating ?? 0,
        hasPhone: data.hasPhone ?? false,
        businessTypes: data.businessTypes ?? [],
        savedAt: data.savedAt ?? 0,
        result: data.result,
      };
    });
    writeCache(uid, list);
    return list;
  } catch (err) {
    console.error("fetchSavedSearches error:", err);
    throw err;
  }
}

export async function saveSavedSearch(uid: string, entry: SavedSearch): Promise<void> {
  await setDoc(savedDocRef(uid, entry.id), sanitizeForFirestore({
    name: entry.name,
    location: entry.location,
    keyword: entry.keyword,
    radius: entry.radius,
    minRating: entry.minRating ?? 0,
    hasPhone: entry.hasPhone ?? false,
    businessTypes: entry.businessTypes ?? [],
    savedAt: entry.savedAt,
    result: entry.result ?? null,
  }));
}

export async function updateSavedResult(
  uid: string,
  id: string,
  result: SearchResult,
): Promise<void> {
  try {
    await updateDoc(savedDocRef(uid, id), { result });
  } catch {
    /* doc may not exist — ignore */
  }
}

export async function deleteSavedSearch(uid: string, id: string): Promise<void> {
  await deleteDoc(savedDocRef(uid, id));
}

export function persistCache(uid: string, list: SavedSearch[]) {
  writeCache(uid, list);
}

// ---- Search history (Firestore + localStorage cache) ----

export type SearchHistory = {
  id: string;
  location: string;
  keyword: string;
  radius: number;
  minRating: number;
  hasPhone: boolean;
  businessTypes: string[];
  searchedAt: number;
  result?: SearchResult;
};

const historyColRef = (uid: string) => collection(getDb(), "users", uid, "searchHistory");
const historyDocRef = (uid: string, id: string) => doc(getDb(), "users", uid, "searchHistory", id);

const historyCacheKey = (uid: string) => `leadfinder.history.v1.${uid}`;

export function loadHistoryCache(uid: string): SearchHistory[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(historyCacheKey(uid)) ?? "[]");
  } catch {
    return [];
  }
}

function writeHistoryCache(uid: string, list: SearchHistory[]) {
  try {
    localStorage.setItem(historyCacheKey(uid), JSON.stringify(list));
  } catch {
    /* quota — ignore */
  }
}

export async function fetchSearchHistory(
  uid: string,
  limit: number = 50,
): Promise<SearchHistory[]> {
  const q = query(historyColRef(uid), orderBy("searchedAt", "desc"));
  const snap = await getDocs(q);
  const list: SearchHistory[] = snap.docs
    .map((d) => {
      const data = d.data() as any;
      return {
        id: d.id,
        location: data.location,
        keyword: data.keyword ?? "",
        radius: data.radius ?? 10,
        minRating: data.minRating ?? 0,
        hasPhone: data.hasPhone ?? false,
        businessTypes: data.businessTypes ?? [],
        searchedAt: data.searchedAt ?? 0,
        result: data.result,
      };
    })
    .slice(0, limit);
  writeHistoryCache(uid, list);
  return list;
}

export async function saveSearchHistory(uid: string, entry: SearchHistory): Promise<void> {
  await setDoc(historyDocRef(uid, entry.id), sanitizeForFirestore({
    location: entry.location,
    keyword: entry.keyword,
    radius: entry.radius,
    minRating: entry.minRating,
    hasPhone: entry.hasPhone,
    businessTypes: entry.businessTypes,
    searchedAt: entry.searchedAt,
    result: entry.result ?? null,
  }));
}

export async function deleteSearchHistory(uid: string, id: string): Promise<void> {
  await deleteDoc(historyDocRef(uid, id));
}

export function persistHistoryCache(uid: string, list: SearchHistory[]) {
  writeHistoryCache(uid, list);
}

// ---- WhatsApp Templates ----

export type WhatsAppTemplate = {
  id: string;
  name: string;
  content: string;
  isDefault: boolean;
  createdAt: number;
  updatedAt: number;
};

const templatesColRef = (uid: string) => collection(getDb(), "users", uid, "whatsappTemplates");
const templateDocRef = (uid: string, id: string) =>
  doc(getDb(), "users", uid, "whatsappTemplates", id);

export async function fetchWhatsAppTemplates(uid: string): Promise<WhatsAppTemplate[]> {
  try {
    const q = query(templatesColRef(uid), orderBy("createdAt", "asc"));
    const snap = await getDocs(q);
    return snap.docs.map((d) => {
      const data = d.data() as any;
      return {
        id: d.id,
        name: data.name,
        content: data.content,
        isDefault: data.isDefault ?? false,
        createdAt: data.createdAt ?? 0,
        updatedAt: data.updatedAt ?? 0,
      };
    });
  } catch {
    return [];
  }
}

export async function saveWhatsAppTemplate(uid: string, template: WhatsAppTemplate): Promise<void> {
  await setDoc(templateDocRef(uid, template.id), {
    name: template.name,
    content: template.content,
    isDefault: template.isDefault,
    createdAt: template.createdAt,
    updatedAt: serverTimestamp(),
  });
}

export async function updateDefaultTemplate(uid: string, templateId: string): Promise<void> {
  // Reset all to non-default
  const templates = await fetchWhatsAppTemplates(uid);
  for (const t of templates) {
    if (t.isDefault) {
      await updateDoc(templateDocRef(uid, t.id), { isDefault: false });
    }
  }
  // Set new default
  await updateDoc(templateDocRef(uid, templateId), { isDefault: true });
}

export async function deleteWhatsAppTemplate(uid: string, id: string): Promise<void> {
  await deleteDoc(templateDocRef(uid, id));
}

export async function getDefaultTemplate(uid: string): Promise<string | null> {
  const templates = await fetchWhatsAppTemplates(uid);
  const defaultTemplate = templates.find((t) => t.isDefault);
  return defaultTemplate?.content ?? null;
}

// ---- Email Templates ----

export type EmailTemplate = {
  id: string;
  name: string;
  subject: string;
  content: string;
  isDefault: boolean;
  createdAt: number;
  updatedAt: number;
};

const emailTemplatesColRef = (uid: string) => collection(getDb(), "users", uid, "emailTemplates");
const emailTemplateDocRef = (uid: string, id: string) =>
  doc(getDb(), "users", uid, "emailTemplates", id);

export async function fetchEmailTemplates(uid: string): Promise<EmailTemplate[]> {
  try {
    const q = query(emailTemplatesColRef(uid), orderBy("createdAt", "asc"));
    const snap = await getDocs(q);
    return snap.docs.map((d) => {
      const data = d.data() as any;
      return {
        id: d.id,
        name: data.name,
        subject: data.subject,
        content: data.content,
        isDefault: data.isDefault ?? false,
        createdAt: data.createdAt ?? 0,
        updatedAt: data.updatedAt ?? 0,
      };
    });
  } catch {
    return [];
  }
}

export async function saveEmailTemplate(uid: string, template: EmailTemplate): Promise<void> {
  await setDoc(emailTemplateDocRef(uid, template.id), {
    name: template.name,
    subject: template.subject,
    content: template.content,
    isDefault: template.isDefault,
    createdAt: template.createdAt,
    updatedAt: serverTimestamp(),
  });
}

export async function updateDefaultEmailTemplate(uid: string, templateId: string): Promise<void> {
  const templates = await fetchEmailTemplates(uid);
  for (const t of templates) {
    if (t.isDefault) {
      await updateDoc(emailTemplateDocRef(uid, t.id), { isDefault: false });
    }
  }
  await updateDoc(emailTemplateDocRef(uid, templateId), { isDefault: true });
}

export async function deleteEmailTemplate(uid: string, id: string): Promise<void> {
  await deleteDoc(emailTemplateDocRef(uid, id));
}

// ---- CRM Leads ----

export type OutreachLog = {
  timestamp: number;
  method: "phone" | "whatsapp" | "email";
  templateUsed?: string;
  notes?: string;
  status: "pending" | "sent" | "failed";
};

export type CRMLead = {
  id: string;
  googlePlaceId: string;
  name: string;
  address: string;
  phone: string | null;
  rating: number | null;
  userRatingCount: number | null;
  types: string[];
  mapsUrl: string;
  status: "new" | "contacted" | "responded" | "converted" | "rejected";
  tags: string[];
  notes: string;
  outreachHistory: OutreachLog[];
  createdAt: number;
  updatedAt: number;
  sourceSearchId?: string;
};

const crmLeadsColRef = (uid: string) => collection(getDb(), "users", uid, "crmLeads");
const crmLeadDocRef = (uid: string, id: string) => doc(getDb(), "users", uid, "crmLeads", id);

export async function fetchCRMLeads(uid: string): Promise<CRMLead[]> {
  try {
    const q = query(crmLeadsColRef(uid), orderBy("updatedAt", "desc"));
    const snap = await getDocs(q);
    return snap.docs.map((d) => {
      const data = d.data() as any;
      return {
        id: d.id,
        googlePlaceId: data.googlePlaceId,
        name: data.name,
        address: data.address,
        phone: data.phone ?? null,
        rating: data.rating ?? null,
        userRatingCount: data.userRatingCount ?? null,
        types: data.types ?? [],
        mapsUrl: data.mapsUrl,
        status: data.status ?? "new",
        tags: data.tags ?? [],
        notes: data.notes ?? "",
        outreachHistory: data.outreachHistory ?? [],
        createdAt: data.createdAt ?? 0,
        updatedAt: data.updatedAt ?? 0,
        sourceSearchId: data.sourceSearchId,
      };
    });
  } catch {
    return [];
  }
}

export async function saveCRMLead(uid: string, lead: CRMLead): Promise<void> {
  await setDoc(
    crmLeadDocRef(uid, lead.id),
    sanitizeForFirestore({
      googlePlaceId: lead.googlePlaceId,
      name: lead.name,
      address: lead.address,
      phone: lead.phone,
      rating: lead.rating,
      userRatingCount: lead.userRatingCount,
      types: lead.types,
      mapsUrl: lead.mapsUrl,
      status: lead.status,
      tags: lead.tags,
      notes: lead.notes,
      outreachHistory: lead.outreachHistory,
      createdAt: lead.createdAt,
      updatedAt: serverTimestamp(),
      sourceSearchId: lead.sourceSearchId,
    }),
    { merge: true },
  );
}

export async function updateCRMLeadStatus(
  uid: string,
  leadId: string,
  status: CRMLead["status"],
): Promise<void> {
  await updateDoc(crmLeadDocRef(uid, leadId), {
    status,
    updatedAt: serverTimestamp(),
  });
}

export async function updateCRMLeadNotes(
  uid: string,
  leadId: string,
  notes: string,
): Promise<void> {
  await updateDoc(crmLeadDocRef(uid, leadId), {
    notes,
    updatedAt: serverTimestamp(),
  });
}

export async function updateCRMLeadTags(
  uid: string,
  leadId: string,
  tags: string[],
): Promise<void> {
  await updateDoc(crmLeadDocRef(uid, leadId), {
    tags,
    updatedAt: serverTimestamp(),
  });
}

export async function addOutreachLog(uid: string, leadId: string, log: OutreachLog): Promise<void> {
  const lead = await getDoc(crmLeadDocRef(uid, leadId));
  if (lead.exists()) {
    const data = lead.data() as any;
    const history = data.outreachHistory ?? [];
    history.push(log);
    await updateDoc(crmLeadDocRef(uid, leadId), {
      outreachHistory: history,
      updatedAt: serverTimestamp(),
    });
  }
}

export async function deleteCRMLead(uid: string, leadId: string): Promise<void> {
  await deleteDoc(crmLeadDocRef(uid, leadId));
}

export async function getCRMLeadStats(uid: string): Promise<{
  total: number;
  byStatus: Record<string, number>;
  contacted: number;
  converted: number;
}> {
  const leads = await fetchCRMLeads(uid);
  const stats = {
    total: leads.length,
    byStatus: { new: 0, contacted: 0, responded: 0, converted: 0, rejected: 0 },
    contacted: 0,
    converted: 0,
  };

  for (const lead of leads) {
    stats.byStatus[lead.status] = (stats.byStatus[lead.status] || 0) + 1;
    if (lead.status !== "new") stats.contacted++;
    if (lead.status === "converted") stats.converted++;
  }

  return stats;
}
