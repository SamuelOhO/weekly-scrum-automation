import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type FormEvent,
  type ChangeEvent,
  type DragEvent,
} from "react";
import { getWeekRange, toLocalISODate, isDateInRange } from "../utils/date";
import type { EntryImage, WeekRange } from "../types";
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
  disabledDates?: string[];
  weekRange: WeekRange;
};

const todayISO = () => toLocalISODate(new Date());

export function EntryForm({
  initialValue,
  onSubmit,
  onCancelEdit,
  disabledDates = [],
  weekRange,
}: EntryFormProps) {
  const [date, setDate] = useState<string>(initialValue?.date ?? todayISO());
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [viewYear, setViewYear] = useState<number>(new Date().getFullYear());
  const [viewMonth, setViewMonth] = useState<number>(new Date().getMonth());
  const [text, setText] = useState<string>(initialValue?.text ?? "");
  const [images, setImages] = useState<EntryImage[]>(initialValue?.images ?? []);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const inputId = useId();
  const disabledSet = useMemo(() => new Set(disabledDates), [disabledDates]);

  useEffect(() => {
    if (initialValue) {
      setDate(initialValue.date ?? todayISO());
      const base = initialValue.date ? new Date(initialValue.date) : new Date();
      setViewYear(base.getFullYear());
      setViewMonth(base.getMonth());
      setText(initialValue.text ?? "");
      setImages(initialValue.images ?? []);
    }
  }, [initialValue]);

  useEffect(() => {
    if (!initialValue && !isDateInRange(date, weekRange)) {
      setDate(weekRange.weekStart);
    }
  }, [weekRange, initialValue, date]);

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    onSubmit({
      id: initialValue?.id,
      date,
      text: text.trim(),
      images,
    });
    setDate(todayISO());
    setText("");
    setImages([]);
    setCalendarOpen(false);
  };

  const week = weekRange;
  const today = useMemo(() => new Date(), []);

  const calendarCells = useMemo(() => {
    const start = new Date(viewYear, viewMonth, 1);
    const startDay = start.getDay();
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const prevMonthDays = new Date(viewYear, viewMonth, 0).getDate();
    const cells: {
      dateISO: string;
      label: number;
      inMonth: boolean;
      isToday: boolean;
      isSelected: boolean;
    }[] = [];

    for (let i = startDay - 1; i >= 0; i--) {
      const d = new Date(viewYear, viewMonth - 1, prevMonthDays - i);
      const iso = toLocalISODate(d);
      cells.push({
        dateISO: iso,
        label: d.getDate(),
        inMonth: false,
        isToday: d.toDateString() === today.toDateString(),
        isSelected: iso === date,
      });
    }

    for (let i = 1; i <= daysInMonth; i++) {
      const d = new Date(viewYear, viewMonth, i);
      const iso = toLocalISODate(d);
      cells.push({
        dateISO: iso,
        label: i,
        inMonth: true,
        isToday: d.toDateString() === today.toDateString(),
        isSelected: iso === date,
      });
    }

    while (cells.length % 7 !== 0 || cells.length < 42) {
      const offset = cells.length - (startDay + daysInMonth);
      const d = new Date(viewYear, viewMonth + 1, offset + 1);
      const iso = toLocalISODate(d);
      cells.push({
        dateISO: iso,
        label: d.getDate(),
        inMonth: false,
        isToday: d.toDateString() === today.toDateString(),
        isSelected: iso === date,
      });
    }

    const weeks: typeof cells[][] = [];
    for (let i = 0; i < cells.length; i += 7) {
      weeks.push(cells.slice(i, i + 7));
    }
    return weeks;
  }, [viewYear, viewMonth, date, today]);

  const readImages = async (fileList: FileList | File[]) => {
    const fileArr = Array.from(fileList).filter(
      (file) => file.type.startsWith("image/") || file.type === ""
    );
    if (fileArr.length === 0) return [];
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
    return Promise.all(readers);
  };

  const appendImages = async (fileList: FileList | File[]) => {
    const imgs = await readImages(fileList);
    if (imgs.length === 0) return;
    setImages((prev) => [...prev, ...imgs]);
  };

  const handleFiles = async (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    try {
      await appendImages(files);
    } catch {
      // no-op; for POC we skip error handling here
    } finally {
      e.target.value = "";
    }
  };

  const handleDrop = async (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const files = e.dataTransfer?.files;
    if (!files || files.length === 0) return;
    try {
      await appendImages(files);
    } catch {
      // no-op; for POC we skip error handling here
    }
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleBrowseClick = () => {
    fileInputRef.current?.click();
  };

  const handleSelectDate = (iso: string) => {
    if (disabledSet.has(iso) && iso !== initialValue?.date) return;
    setDate(iso);
    const base = new Date(iso);
    setViewYear(base.getFullYear());
    setViewMonth(base.getMonth());
    setCalendarOpen(false);
  };

  const handlePrevMonth = () => {
    const prev = new Date(viewYear, viewMonth - 1, 1);
    setViewYear(prev.getFullYear());
    setViewMonth(prev.getMonth());
  };

  const handleNextMonth = () => {
    const next = new Date(viewYear, viewMonth + 1, 1);
    setViewYear(next.getFullYear());
    setViewMonth(next.getMonth());
  };

  const handleToday = () => {
    const iso = todayISO();
    setDate(iso);
    const base = new Date(iso);
    setViewYear(base.getFullYear());
    setViewMonth(base.getMonth());
    setCalendarOpen(false);
  };

  const handleRemoveImage = (id: string) => {
    setImages((prev) => prev.filter((img) => img.id !== id));
  };

  const toggleCalendar = () => setCalendarOpen((prev) => !prev);
  const closeCalendar = () => setCalendarOpen(false);

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
          <div className="date-field">
            <button
              type="button"
              className={`date-display ${calendarOpen ? "open" : ""}`}
              onClick={toggleCalendar}
            >
              <span className={date ? "" : "muted"}>
                {date ? date.replace(/-/g, ".") : "YYYY.MM.DD"}
              </span>
              <span aria-hidden="true" className="date-caret">▾</span>
            </button>
            {calendarOpen && (
              <div className="date-popover">
                <div className="date-popover-header">
                  <button type="button" className="icon-btn" onClick={handlePrevMonth}>‹</button>
                  <div className="date-popover-title">
                    {viewYear}년 {viewMonth + 1}월
                  </div>
                  <button type="button" className="icon-btn" onClick={handleNextMonth}>›</button>
                </div>
                <div className="date-weekdays">
                  {["일", "월", "화", "수", "목", "금", "토"].map((d) => (
                    <div key={d} className="date-weekday">{d}</div>
                  ))}
                </div>
                <div className="date-grid">
                  {calendarCells.map((week, idx) => (
                    <div key={idx} className="date-week-row">
                      {week.map((cell) => (
                        <button
                          key={cell.dateISO}
                          type="button"
                          className={`date-cell ${cell.inMonth ? "" : "muted"} ${cell.isToday ? "today" : ""} ${cell.isSelected ? "selected" : ""} ${disabledSet.has(cell.dateISO) && cell.dateISO !== initialValue?.date ? "disabled" : ""}`}
                          disabled={disabledSet.has(cell.dateISO) && cell.dateISO !== initialValue?.date}
                          onClick={() => handleSelectDate(cell.dateISO)}
                        >
                          {cell.label}
                        </button>
                      ))}
                    </div>
                  ))}
                </div>
                <div className="date-popover-footer">
                  <button type="button" className="btn secondary compact" onClick={handleToday}>
                    오늘
                  </button>
                  <div className="button-row" style={{ marginLeft: "auto" }}>
                    <button type="button" className="btn secondary compact" onClick={closeCalendar}>
                      취소
                    </button>
                    <button type="button" className="btn primary compact" onClick={closeCalendar}>
                      선택
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
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
          <div
            className={`dropzone ${isDragging ? "drag-active" : ""}`}
            onDragOver={handleDragOver}
            onDragEnter={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={(e) => {
              if (e.target === e.currentTarget) handleBrowseClick();
            }}
          >
            <div className="dropzone-header">
              <span className="pill subtle">이미지 업로드</span>
              <span className="muted small">PNG/JPG, 여러 장 가능</span>
            </div>
            <div className="dropzone-actions">
              <span className="muted small">클릭하거나 드래그하여 첨부</span>
            </div>
            <input
              id={inputId}
              ref={fileInputRef}
              className="visually-hidden"
              type="file"
              accept="image/*"
              multiple
              onChange={handleFiles}
            />
          </div>
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
