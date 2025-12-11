import type { Entry, WeekRange } from "../types";

export const callSolar = async (
  entries: Entry[],
  weekRange: WeekRange
): Promise<string> => {
  const response = await fetch("/api/solar", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ entries, weekRange }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Upstage 프록시 오류: ${response.status} ${errorText}`);
  }

  const data = (await response.json()) as { content?: string };
  const content = data.content?.trim();
  if (!content) {
    throw new Error("Upstage 응답이 비어 있습니다.");
  }
  return content;
};
