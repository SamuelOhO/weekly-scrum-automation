import { useEffect, useState, type FormEvent, type ChangeEvent } from "react";
import { getWeekRange } from "../utils/date";
import type { EntryImage } from "../types";
import { generateId } from "../utils/uuid";

type EntryDraft = {
  id?: string;
  date: string;
  text: string;
  images?: EntryImage[];
};

type EntryFormProps = {
  initialValue?: EntryDraft;
  onSubmit: (draft: EntryDraft) => void;
  onCancelEdit?: () => void;
};

const todayISO = () => new Date().toISOString().slice(0, 10);

export function EntryForm({
  initialValue,
  onSubmit,
  onCancelEdit,
}: EntryFormProps) {
  const [date, setDate] = useState<string>(initialValue?.date ?? todayISO());
  const [text, setText] = useState<string>(initialValue?.text ?? "");
  const [images, setImages] = useState<EntryImage[]>(initialValue?.images ?? []);

  useEffect(() => {
    if (initialValue) {
      setDate(initialValue.date ?? todayISO());
      setText(initialValue.text ?? "");
      setImages(initialValue.images ?? []);
    }
  }, [initialValue]);

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    onSubmit({
      id: initialValue?.id,
      date,
      text: text.trim(),
      images,
    });
  };

  const week = getWeekRange(new Date(date));

  const handleFiles = async (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    const fileArr = Array.from(files);
    const readers = fileArr.map(
      (file) =>
        new Promise<EntryImage>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => {
            resolve({
              id: generateId(),
              mime: file.type || "application/octet-stream",
              dataUrl: reader.result as string,
              name: file.name,
            });
          };
          reader.onerror = () => reject(reader.error);
          reader.readAsDataURL(file);
        })
    );
    try {
      const imgs = await Promise.all(readers);
      setImages((prev) => [...prev, ...imgs]);
    } catch {
      // no-op; for POC we skip error handling here
    } finally {
      e.target.value = "";
    }
  };

  const handleRemoveImage = (id: string) => {
    setImages((prev) => prev.filter((img) => img.id !== id));
  };

  return (
    <div className="card">
      <div className="section-header">
        <div>
          <h3>데일리 메모 입력</h3>
          <p className="muted">이번 주 범위: {week.weekStart} ~ {week.weekEnd}</p>
        </div>
        {initialValue?.id && (
          <span className="pill">수정 모드</span>
        )}
      </div>
      <form className="grid" onSubmit={handleSubmit}>
        <label className="grid" style={{ gap: "6px" }}>
          <span className="muted">날짜</span>
          <input
            className="input"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
          />
        </label>
        <label className="grid" style={{ gap: "6px" }}>
          <span className="muted">내용</span>
          <textarea
            className="textarea"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="오늘 한 일, 진행 중, 블로커 등을 자유롭게 적어주세요."
            required
          />
        </label>
        <label className="grid" style={{ gap: "6px" }}>
          <span className="muted">이미지 첨부 (선택)</span>
          <input className="input" type="file" accept="image/*" multiple onChange={handleFiles} />
          {images.length > 0 && (
            <div className="grid" style={{ gap: "8px" }}>
              {images.map((img) => (
                <div key={img.id} className="entry-card">
                  <div className="entry-meta">
                    <span className="pill">{img.name ?? "첨부 이미지"}</span>
                    <button
                      type="button"
                      className="btn secondary"
                      onClick={() => handleRemoveImage(img.id)}
                    >
                      삭제
                    </button>
                  </div>
                  <img
                    src={img.dataUrl}
                    alt={img.name ?? "첨부 이미지"}
                    style={{ maxWidth: "100%", borderRadius: 8 }}
                  />
                </div>
              ))}
            </div>
          )}
        </label>
        <div className="button-row">
          <button type="submit" className="btn primary">
            {initialValue?.id ? "수정 저장" : "저장"}
          </button>
          {initialValue?.id && onCancelEdit && (
            <button type="button" className="btn secondary" onClick={onCancelEdit}>
              수정 취소
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
