export type Entry = {
  id: string;
  date: string; // ISO yyyy-mm-dd
  text: string;
  createdAt: number;
  images?: EntryImage[];
};

export type Summary = {
  content: string;
  generatedAt: number;
  weekStart: string;
  weekEnd: string;
};

export type WeekRange = {
  weekStart: string;
  weekEnd: string;
};

export type EntryImage = {
  id: string;
  mime: string;
  dataUrl: string; // data:<mime>;base64,<data>
  name?: string;
};
