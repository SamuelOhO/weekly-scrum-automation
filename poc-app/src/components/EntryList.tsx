import type { Entry } from "../types";

type EntryListProps = {
  entries: Entry[];
  onEdit: (entry: Entry) => void;
  onDelete: (id: string) => void;
};

const formatDate = (dateISO: string) =>
  new Date(dateISO).toLocaleDateString("ko-KR", {
    month: "short",
    day: "numeric",
    weekday: "short",
  });

export function EntryList({ entries, onEdit, onDelete }: EntryListProps) {
  if (!entries.length) {
    return (
      <div className="card empty">
        이번 주 메모가 없습니다. 데일리를 추가해 주세요.
      </div>
    );
  }

  return (
    <div className="card grid">
      <div className="section-header">
        <h3>이번 주 메모</h3>
        <span className="pill">{entries.length}개</span>
      </div>
      <div className="grid" style={{ gap: "10px" }}>
        {entries.map((entry) => (
          <div key={entry.id} className="entry-card">
            <div className="entry-meta">
              <span className="pill">{formatDate(entry.date)}</span>
              <div className="button-row" style={{ gap: "6px" }}>
                <button className="btn secondary" onClick={() => onEdit(entry)}>
                  수정
                </button>
                <button className="btn secondary" onClick={() => onDelete(entry.id)}>
                  삭제
                </button>
              </div>
            </div>
            {(entry.images?.length ?? 0) > 0 && (
              <div className="pill" style={{ background: "#f0f4ff", color: "#1f4b99" }}>
                이미지 {entry.images?.length}개 첨부됨
              </div>
            )}
            <div>{entry.text}</div>
            {(entry.images?.length ?? 0) > 0 && (
              <div className="image-grid">
                {entry.images?.map((img) => (
                  <div key={img.id} className="image-thumb">
                    <div className="image-thumb-inner">
                      <img
                        src={img.dataUrl}
                        alt={img.name ?? "첨부 이미지"}
                        className="image-thumb-img"
                      />
                    </div>
                    <div className="muted" style={{ fontSize: 12, wordBreak: "break-all" }}>
                      {img.name ?? "첨부"}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
