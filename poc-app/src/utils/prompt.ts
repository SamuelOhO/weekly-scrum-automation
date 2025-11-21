import type { Entry, WeekRange } from "../types";

export const buildPrompt = (entries: Entry[], range: WeekRange) => {
  const header = [
    "이번 주(월~금) 데일리 메모를 주간회의용으로 요약해줘.",
    "- 날짜 순서를 고려해 흐름을 이해하고, 반복 태스크는 한 문장으로 통합",
    "- 사람/팀/프로젝트 이름은 원문 유지",
    "- 불확실한 내용은 “(확인 필요)”라고 표기",
    "- “없음”, “TL;DR” 같은 메타 표현은 쓰지 말 것",
    "- 주간회의는 날짜별로 서술하지 않고 카테고리 별로 완성 혹은 진행하고 있는 사항을 적어줄것",
    "이모지 사용 금지 # 사용 금지. - 대쉬만 사용",
    `기간: ${range.weekStart} ~ ${range.weekEnd}`,
    "",
    "데일리 메모 (날짜순):",
  ];

  const body = entries
    .map((entry) => `${entry.date}: ${entry.text.trim()}`)
    .join("\n");

  return header.join("\n") + (body || "메모가 비어 있습니다. 입력된 내용만으로 간결히 작성해주세요.");
};
