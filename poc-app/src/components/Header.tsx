import type { WeekRange } from "../types";

type HeaderProps = {
  weekRange: WeekRange;
  onGenerate: () => void;
  lastGeneratedAt?: number;
  loading?: boolean;
};

const formatDateRange = (range: WeekRange) =>
  `${range.weekStart} ~ ${range.weekEnd}`;

const formatGeneratedAt = (timestamp?: number) =>
  timestamp
    ? new Date(timestamp).toLocaleString("ko-KR", {
        dateStyle: "medium",
        timeStyle: "short",
      })
    : "생성 기록 없음";

export function Header({
  weekRange,
  onGenerate,
  lastGeneratedAt,
  loading = false,
}: HeaderProps) {
  return (
    <header className="card section-header">
      <div>
        <h2>이번 주</h2>
        <p className="muted">{formatDateRange(weekRange)}</p>
        <p className="muted">마지막 생성: {formatGeneratedAt(lastGeneratedAt)}</p>
      </div>
      <div className="button-row">
        <button className="btn primary" onClick={onGenerate} disabled={loading}>
          {loading ? "생성 중..." : "주간 생성"}
        </button>
      </div>
    </header>
  );
}
