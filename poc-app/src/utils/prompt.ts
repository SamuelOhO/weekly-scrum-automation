import type { Entry, WeekRange } from "../types";

export const buildPrompt = (entries: Entry[], range: WeekRange) => {
  const instructions = `
이번 주(월~금) 데일리 메모를 주간회의용으로 요약해줘.
날짜 순서를 고려해 흐름을 이해하고, 반복 태스크는 한 문장으로 통합해.
사람/팀/프로젝트 이름은 원문을 그대로 써.
불확실한 내용은 “(확인 필요)”라고 표기해.
“없음”, “TL;DR” 같은 메타 표현은 쓰지 마.
주간회의는 날짜별이 아니라 카테고리별(해당 콘텐츠의 주제별)로 묶어줘.
이모지, #, 불릿 대신 대시(-)만 사용해.
기간: ${range.weekStart} ~ ${range.weekEnd}.
`.trim();

  const example = `
예시 답안:
- 웹서버 침해 테스트 진행 중(11/17 ~)

- AMES 특허 미팅
  -- 기본적인 워크플로우 모듈화 발표자료 정리
  -- 추가 요청사항으로 플로우차트 자료 정리 진행 중

- BE
  -- 성과평가 BE 각각 콘텐츠 별 모두 API 및 간단한 리팩토링

- 시나리오 테스트
  -- 시나리오 테스트 히스토리 인수인계 완료
  -- 국내(채권, 주식), 해외(채권, 주식) 기관컨설팅 DB 확인 완료
  -- 함수 구현 진행

- FE
  -- 대체투자 > 투자현황 피드백 이후 변경 api 연동 및 화면 재개발
  -- 대체투자 > 성과·현금흐름분석 화면 설계 및 api연동완료
`.trim();

  const body = entries
    .map((entry) => `${entry.date}: ${entry.text.trim()}`)
    .join("\n");

  return `${instructions}\n\n${example}\n\n데일리 메모 (날짜순):\n${body || "메모가 비어 있습니다. 입력된 내용만으로 간결히 작성해주세요."}`;
};