import type { Entry, WeekRange } from "../types";

const toISODate = (date: Date) => date.toISOString().slice(0, 10);

const normalizeDate = (date: Date) =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate());

export const getWeekRange = (baseDate = new Date()): WeekRange => {
  const today = normalizeDate(baseDate);
  const day = today.getDay(); // 0 (Sun) ... 6 (Sat)
  // Monday = 1; if Sunday, go back 6 days.
  const diffToMonday = day === 0 ? -6 : 1 - day;

  const monday = new Date(today);
  monday.setDate(today.getDate() + diffToMonday);

  const friday = new Date(monday);
  friday.setDate(monday.getDate() + 4);

  return { weekStart: toISODate(monday), weekEnd: toISODate(friday) };
};

export const isDateInRange = (dateISO: string, range: WeekRange) => {
  const target = normalizeDate(new Date(dateISO));
  const start = normalizeDate(new Date(range.weekStart));
  const end = normalizeDate(new Date(range.weekEnd));
  return target >= start && target <= end;
};

export const filterEntriesInRange = (entries: Entry[], range: WeekRange) =>
  entries.filter((entry) => isDateInRange(entry.date, range));

export const sortByDateAsc = <T extends { date: string }>(items: T[]) =>
  [...items].sort(
    (a, b) =>
      new Date(a.date).getTime() - new Date(b.date).getTime()
  );
