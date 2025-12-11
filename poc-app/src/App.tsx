import { useEffect, useMemo, useState } from "react";
import "./style.css";
import type { Entry, Summary } from "./types";
import { deleteEntry, loadEntries, saveEntries, upsertEntry } from "./utils/storage";
import {
  addDays,
  filterEntriesInRange,
  getWeekRange,
  toLocalISODate,
} from "./utils/date";
import { EntryForm } from "./components/EntryForm";
import { EntryList } from "./components/EntryList";
import { SummaryPanel } from "./components/SummaryPanel";
import { callSolar } from "./utils/openai";
import { generateId } from "./utils/uuid";

function App() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [draft, setDraft] = useState<Entry | undefined>();
  const [summary, setSummary] = useState<Summary | undefined>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [weekOffset, setWeekOffset] = useState(0); // 0: this week, -1: last week, etc.
  const getISOWeek = (isoDate: string) => {
    const d = new Date(isoDate + "T00:00:00");
    const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    const dayNum = date.getUTCDay() || 7;
    date.setUTCDate(date.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
    return Math.ceil(((date.valueOf() - yearStart.valueOf()) / 86400000 + 1) / 7);
  };

  const weekRange = useMemo(
    () => getWeekRange(addDays(new Date(), weekOffset * 7)),
    [weekOffset]
  );
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
    if (
      draftEntry.date &&
      entries.some((e) => e.date === draftEntry.date && e.id !== draftEntry.id)
    ) {
      window.alert("해당 날짜의 메모가 이미 있습니다. 삭제하거나 수정 모드로 변경해 주세요.");
      return;
    }

    const entry: Entry = {
      id: draftEntry.id ?? generateId(),
      date: draftEntry.date ?? toLocalISODate(new Date()),
      text: draftEntry.text ?? "",
      createdAt: draftEntry.createdAt ?? now,
      images: draftEntry.images ?? [],
    };
    setEntries((prev: Entry[]) => {
      const withoutDate = prev.filter((e) => e.date !== entry.date || e.id === entry.id);
      return upsertEntry(withoutDate, entry);
    });
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
      const content = await callSolar(weekEntries, weekRange);
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

  const formatGeneratedAt = (timestamp?: number) =>
    timestamp
      ? new Date(timestamp).toLocaleString("ko-KR", {
          dateStyle: "medium",
          timeStyle: "short",
        })
      : "생성 기록 없음";

  const handlePrevWeek = () => setWeekOffset((prev) => prev - 1);
  const handleNextWeek = () => setWeekOffset((prev) => Math.min(prev + 1, 0));
  const weekLabel = `${weekRange.weekStart.replace(/-/g, ".")} ~ ${weekRange.weekEnd.replace(
    /-/g,
    "."
  )}`;
  const weekNumber = getISOWeek(weekRange.weekStart);

  return (
    <div className="app-shell">
      <nav className="nav-bar">
        <div className="nav-brand">Weekly Agent</div>
        <div className="nav-links">
          <button className="nav-link active" type="button">데일리</button>
          <button className="nav-link" type="button">요약</button>
          <button className="nav-link" type="button">히스토리</button>
        </div>
        <div className="nav-cta">
          <span className="pill subtle">v1.0</span>
        </div>
      </nav>
      <div className="page-hero card">
        <div className="hero-text">
          <p className="eyebrow">Weekly Agent</p>
          <h1 className="page-title">팀 데일리 → 주간 회의, 한 화면에서</h1>
          <p className="muted">
            주간 범위: {weekLabel}
          </p>
          <div className="hero-meta">
            <span className="pill subtle">메모 {weekEntries.length}개</span>
            <span className="pill subtle">마지막 생성: {formatGeneratedAt(summary?.generatedAt)}</span>
            <span className="pill subtle">ISO Week {weekNumber}</span>
          </div>
        </div>
        <div className="hero-actions">
          <div className="week-nav">
            <button className="week-step" onClick={handlePrevWeek} aria-label="이전 주">‹</button>
            <div className="week-chip">
              <span className="muted small">주차</span>
              <strong>{weekLabel}</strong>
            </div>
            <button className="week-step" onClick={handleNextWeek} disabled={weekOffset === 0} aria-label="다음 주">›</button>
          </div>
          <button className="btn primary" onClick={handleGenerate} disabled={loading}>
            {loading ? "생성 중..." : "주간 요약 생성"}
          </button>
          <button
            className="btn secondary"
            onClick={() => summary?.content && handleCopy(summary.content)}
            disabled={!summary?.content || loading}
          >
            요약 복사
          </button>
        </div>
      </div>
      <div className="content-grid">
        <div className="column column-main">
          <EntryForm
            initialValue={draft}
            onSubmit={handleSave}
            onCancelEdit={handleCancelEdit}
            disabledDates={weekEntries.filter((e) => e.id !== draft?.id).map((e) => e.date)}
            weekRange={weekRange}
          />
          <EntryList entries={weekEntries} onEdit={handleEdit} onDelete={handleDelete} />
        </div>
        <div className="column column-side">
          <div className="sticky-panel">
            <SummaryPanel
              summary={summary}
              loading={loading}
              error={error}
              onGenerate={handleGenerate}
              onCopy={handleCopy}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
