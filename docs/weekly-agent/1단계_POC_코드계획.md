# 1단계 로컬 POC 코드 작성 계획서 (React + localStorage)

## 목표 및 제약
- 브라우저 localStorage에 데일리 메모 저장/수정/삭제.
- 이번 주(월~금) 메모만 모아 “주간 생성” 버튼으로 요약(OpenAI API 호출) → 텍스트 표시/복사.
- 디자인: 미니멀, 라운드 카드, 연한 회색 배경 + 파스텔 포인트.
- 배포 없이 로컬에서 `npm run dev`로 사용(Color/폰트는 웹 기본+약간의 커스텀 CSS).

## 기술 스택
- React (Vite or CRA 중 택1, POC에선 Vite + TypeScript 추천).
- 상태 관리: React hooks(useState/useEffect), localStorage sync.
- 스타일: CSS 모듈 또는 단일 CSS 파일(간단한 토큰).
- OpenAI 호출: fetch API + `.env.local`에 `VITE_OPENAI_API_KEY` 저장.

## 화면/컴포넌트 설계
- `App` (레이아웃, 색 변수, 배경 적용)
- `Header` (주간 범위 표시 + “주간 생성” 버튼 + 마지막 생성 시간)
- `EntryForm` (날짜 입력, 텍스트 입력, 저장 버튼)
- `EntryList` (이번 주 필터링 리스트, 각 항목에 수정/삭제/저장)
- `SummaryPanel` (요약 결과, 로딩/에러, 복사/재생성 버튼)

## 데이터 모델
```ts
export type Entry = {
  id: string; // uuid
  date: string; // ISO yyyy-mm-dd
  text: string;
  createdAt: number;
};

export type Summary = {
  content: string;
  generatedAt: number;
  weekStart: string;
  weekEnd: string;
};
```

## 유틸 함수 계획
- 날짜 유틸: `getWeekRange(date = today)` → {weekStart, weekEnd} (월~금 기준).
- localStorage: `loadEntries()`, `saveEntries(entries)`, `upsertEntry(entry)`, `deleteEntry(id)`.
- 주간 필터: `filterEntriesThisWeek(entries, weekRange)`.
- LLM 프롬프트 생성: `buildPrompt(entries, weekRange)`.
- 요약 호출: `callOpenAI(prompt, apiKey)` → summary string.

## 상태 흐름
- 초기 렌더: localStorage에서 entries 로드 → state 세팅.
- 저장: form submit → 새 Entry 생성 또는 수정 → state 업데이트 → localStorage 반영.
- 삭제: id로 filter → state 업데이트 → localStorage 반영.
- 주간 생성: 버튼 클릭 → thisWeek entries → prompt 생성 → OpenAI 호출 → summary state 세팅.
- 재생성: 동일 프로세스 재호출.
- 복사: `navigator.clipboard.writeText(summary.content)`.

## 프롬프트 예시 (프론트 내 하드코딩)
```
아래는 이번 주(월~금) 데일리 메모입니다.
- 완료/진행/블로커/결정/요청 5섹션으로 요약
- 섹션당 3~5줄, 중복 제거, 불확실 시 “(확인 필요)” 표시
- TL;DR 3줄을 맨 위에 작성
- 출력은 순수 텍스트, 마크다운 불필요

{날짜별 메모}
```
날짜별 메모 포맷: `YYYY-MM-DD: 내용` 줄바꿈.

## 스타일 토큰(예시)
- 배경: `#f6f7fb`
- 카드: `#ffffff` + 그림자 `0 4px 12px rgba(0,0,0,0.08)`
- 포인트: 파스텔 블루 `#6da4ff` / 민트 `#6ed3c6`
- 폰트: system-ui, 16px 기본, 라운드 버튼(border-radius: 12px)

## 작업 순서 (Plan)
1) Vite 앱 생성(TypeScript) 및 기본 정리(CSS 리셋, 색 변수).
2) 타입/유틸 구현: 날짜 계산, localStorage helpers, uuid 생성(예: `crypto.randomUUID`).
3) 전역 스타일/레이아웃: 배경, 카드, 버튼 공통 클래스.
4) 컴포넌트 구현
   - Header: 주차 범위 계산, “주간 생성” 버튼 → handler prop 호출.
   - EntryForm: 날짜+텍스트 입력, 저장/수정 지원.
   - EntryList: 현재 주 entries 표시, edit/delete 콜백 연결.
   - SummaryPanel: 로딩/에러/결과/복사/재생성.
5) App 조립: state 관리, handlers 연결, thisWeek 필터 적용.
6) OpenAI 연동: `.env.local` 키 읽기, fetch 호출, 에러/로딩 처리.
7) 마감 QA: 입력/수정/삭제/요약/복사 시나리오 점검, localStorage 초기화 동작 확인.

## 테스트 시나리오
- 데일리 3건 입력 후 새로고침 → 데이터 유지 확인.
- 이번 주 필터가 월~금만 포함되는지 확인(일/토 제외).
- 요약 실패(OpenAI 키 없음) 시 에러 토스트/문구 표시.
- 복사 버튼 클릭 시 클립보드에 결과가 담기는지 확인.
- 수정 후 저장했을 때 요약에 반영되는지 확인.
