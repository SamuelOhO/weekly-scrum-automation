import { useEffect, useMemo, useState } from "react";
import "./style.css";
import type { Entry, Summary } from "./types";
import { deleteEntry, loadEntries, saveEntries, upsertEntry } from "./utils/storage";
import { filterEntriesInRange, getWeekRange } from "./utils/date";
import { Header } from "./components/Header";
import { EntryForm } from "./components/EntryForm";
import { EntryList } from "./components/EntryList";
import { SummaryPanel } from "./components/SummaryPanel";
import { callClaude } from "./utils/openai";
import { generateId } from "./utils/uuid";

function App() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [draft, setDraft] = useState<Entry | undefined>();
  const [summary, setSummary] = useState<Summary | undefined>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const weekRange = useMemo(() => getWeekRange(), []);
  const weekEntries = useMemo(
    () => filterEntriesInRange(entries, weekRange),
    [entries, weekRange]
  );

  useEffect(() => {
    setEntries(loadEntries());
  }, []);

  useEffect(() => {
    saveEntries(entries);
  }, [entries]);

  const handleSave = (draftEntry: Partial<Entry>) => {
    const now = Date.now();
    const entry: Entry = {
      id: draftEntry.id ?? generateId(),
      date: draftEntry.date ?? new Date().toISOString().slice(0, 10),
      text: draftEntry.text ?? "",
      createdAt: draftEntry.createdAt ?? now,
      images: draftEntry.images ?? [],
    };
    setEntries((prev: Entry[]) => upsertEntry(prev, entry));
    setDraft(undefined);
  };

  const handleEdit = (entry: Entry) => setDraft(entry);

  const handleCancelEdit = () => setDraft(undefined);

  const handleDelete = (id: string) => {
    setEntries((prev: Entry[]) => deleteEntry(prev, id));
  };

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);
    try {
      if (weekEntries.length === 0) {
        throw new Error("이번 주 메모가 없습니다. 메모를 추가해 주세요.");
      }
      const content = await callClaude(weekEntries, weekRange);
      setSummary({
        content,
        generatedAt: Date.now(),
        weekStart: weekRange.weekStart,
        weekEnd: weekRange.weekEnd,
      });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "요약 생성에 실패했습니다.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard?.writeText(text);
  };

  return (
    <div className="app-shell">
      <Header
        weekRange={weekRange}
        onGenerate={handleGenerate}
        lastGeneratedAt={summary?.generatedAt}
        loading={loading}
      />
      <EntryForm
        initialValue={draft}
        onSubmit={handleSave}
        onCancelEdit={handleCancelEdit}
      />
      <EntryList entries={weekEntries} onEdit={handleEdit} onDelete={handleDelete} />
      <SummaryPanel
        summary={summary}
        loading={loading}
        error={error}
        onGenerate={handleGenerate}
        onCopy={handleCopy}
      />
    </div>
  );
}

export default App;
