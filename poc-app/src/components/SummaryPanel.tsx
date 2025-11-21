import type { Summary } from "../types";

type SummaryPanelProps = {
  summary?: Summary;
  loading?: boolean;
  error?: string | null;
  onGenerate: () => void;
  onCopy: (text: string) => void;
};

const formatGeneratedAt = (timestamp: number) =>
  new Date(timestamp).toLocaleString("ko-KR", {
    dateStyle: "medium",
    timeStyle: "short",
  });

export function SummaryPanel({
  summary,
  loading = false,
  error,
  onGenerate,
  onCopy,
}: SummaryPanelProps) {
  return (
    <div className="card grid">
      <div className="section-header">
        <div>
          <h3>주간 요약</h3>
          <p className="muted">
            {summary?.generatedAt
              ? `생성 시각: ${formatGeneratedAt(summary.generatedAt)}`
              : "아직 생성되지 않음"}
          </p>
        </div>
        <div className="button-row">
          <button className="btn primary" onClick={onGenerate} disabled={loading}>
            {loading ? "생성 중..." : "재생성"}
          </button>
          <button
            className="btn secondary"
            onClick={() => summary && onCopy(summary.content)}
            disabled={!summary || loading}
          >
            복사
          </button>
        </div>
      </div>
      {error && (
        <div className="pill" style={{ background: "#ffecec", color: "#c53030" }}>
          {error}
        </div>
      )}
      <div className="summary-box">
        {loading && "요약 생성 중..."}
        {!loading && summary?.content}
        {!loading && !summary && !error && "아직 요약이 없습니다. 생성 버튼을 눌러주세요."}
      </div>
    </div>
  );
}
