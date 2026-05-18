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

export type SavedSearch = {
  id: string;
  name: string;
  location: string;
  keyword: string;
  radius: number;
  savedAt: number;
  result?: SearchResult;
};

const userDocRef = (uid: string) => doc(getDb(), "users", uid);
const savedColRef = (uid: string) => collection(getDb(), "users", uid, "savedSearches");
const savedDocRef = (uid: string, id: string) =>
  doc(getDb(), "users", uid, "savedSearches", id);

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
      savedAt: data.savedAt ?? 0,
      result: data.result,
    };
  });
  writeCache(uid, list);
  return list;
}

export async function saveSavedSearch(uid: string, entry: SavedSearch): Promise<void> {
  await setDoc(savedDocRef(uid, entry.id), {
    name: entry.name,
    location: entry.location,
    keyword: entry.keyword,
    radius: entry.radius,
    savedAt: entry.savedAt,
    result: entry.result ?? null,
  });
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
  searchedAt: number;
  result?: SearchResult;
};

const historyColRef = (uid: string) => collection(getDb(), "users", uid, "searchHistory");
const historyDocRef = (uid: string, id: string) =>
  doc(getDb(), "users", uid, "searchHistory", id);

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

export async function fetchSearchHistory(uid: string, limit: number = 50): Promise<SearchHistory[]> {
  const q = query(historyColRef(uid), orderBy("searchedAt", "desc"));
  const snap = await getDocs(q);
  const list: SearchHistory[] = snap.docs.map((d) => {
    const data = d.data() as any;
    return {
      id: d.id,
      location: data.location,
      keyword: data.keyword ?? "",
      radius: data.radius ?? 10,
      searchedAt: data.searchedAt ?? 0,
      result: data.result,
    };
  }).slice(0, limit);
  writeHistoryCache(uid, list);
  return list;
}

export async function saveSearchHistory(uid: string, entry: SearchHistory): Promise<void> {
  await setDoc(historyDocRef(uid, entry.id), {
    location: entry.location,
    keyword: entry.keyword,
    radius: entry.radius,
    searchedAt: entry.searchedAt,
    result: entry.result ?? null,
  });
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
