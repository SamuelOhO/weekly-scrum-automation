import type { Entry } from "../types";
import { sortByDateAsc } from "./date";

const STORAGE_KEY = "weekly-agent-entries";

export const loadEntries = (): Entry[] => {
  if (typeof localStorage === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Entry[];
    return parsed.map((entry) => ({
      ...entry,
      text: entry.text ?? "",
      date: entry.date,
      createdAt: entry.createdAt ?? Date.now(),
      id: entry.id,
      images: entry.images ?? [],
    }));
  } catch {
    return [];
  }
};

export const saveEntries = (entries: Entry[]) => {
  if (typeof localStorage === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
};

export const upsertEntry = (entries: Entry[], next: Entry): Entry[] => {
  const existingIndex = entries.findIndex((e) => e.id === next.id);
  if (existingIndex === -1) {
    return sortByDateAsc([...entries, next]);
  }
  const updated = [...entries];
  updated[existingIndex] = next;
  return sortByDateAsc(updated);
};

export const deleteEntry = (entries: Entry[], id: string): Entry[] =>
  entries.filter((e) => e.id !== id);
