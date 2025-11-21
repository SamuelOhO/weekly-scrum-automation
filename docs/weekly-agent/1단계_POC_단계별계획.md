# 1단계 POC 단계별 작업 계획

## 0. 환경 준비
- `npm create vite@latest`로 React+TS POC 생성, `npm install`.
- `.env.local`에 `VITE_OPENAI_API_KEY` 추가(키 없으면 요약 호출 실패하도록 가드).
- 기본 스타일 리셋 파일 추가(배경/폰트 토큰).

## 1. 타입/유틸 구축
- 타입 정의: `Entry {id, date, text, createdAt}`, `Summary {content, generatedAt, weekStart, weekEnd}`.
- 날짜 유틸: `getWeekRange(today)` → 월~금 범위 계산. `isDateInRange(date, range)`.
- localStorage 헬퍼: `loadEntries`, `saveEntries`, `upsertEntry`, `deleteEntry`.
- 프롬프트 builder: thisWeek entries를 날짜순 문자열로 합쳐 응답.

## 2. 전역 스타일/레이아웃
- 색 토큰/폰트 정의: 배경 `#f6f7fb`, 카드 `#fff`, 포인트 `#6da4ff`, `#6ed3c6`.
- 공통 카드/버튼/인풋 스타일(CSS) 작성, 라운딩 12px.
- 전체 레이아웃: 최대 너비 960px, 중앙 정렬, 섹션 간 여백.

## 3. 컴포넌트 구현
- `Header`: 주차 범위 표시, “주간 생성” 버튼, 마지막 생성 시간 표시.
- `EntryForm`: 날짜 입력(date), 텍스트 입력, 저장/수정, 제출 시 상위 handler 호출.
- `EntryList`: 이번 주 entries 표시, edit/delete 버튼, 비어있을 때 안내 문구.
- `SummaryPanel`: 요약 결과/로딩/에러 표시, 복사/재생성 버튼.

## 4. App 상태/핸들러 조립
- state: `entries`, `draft`(수정용), `summary`, `loading`, `error`.
- 초기화: `useEffect`로 localStorage 로드 → state 세팅.
- 저장: 신규/수정 분기 → `upsertEntry` → localStorage 반영.
- 삭제: id로 filter → localStorage 저장.
- 주간 생성: thisWeek entries 가져와 prompt → OpenAI fetch → summary state 저장.
- 복사: `navigator.clipboard.writeText`로 summary 복사.
- 에러 처리: 키 없거나 실패 시 에러 메시지 노출.

## 5. OpenAI 연동
- 함수 `callOpenAI(prompt, apiKey)`: POST gpt-4o-mini 등, 응답 텍스트 반환.
- 로딩 스피너/재시도 버튼 처리.
- 키 미설정 시 early return + 에러 표시.

## 6. QA 및 다듬기
- 시나리오 테스트: 입력/수정/삭제/새로고침 유지/요약 실패/복사 동작.
- 여백, 반응형(모바일) 점검: 버튼 줄바꿈, 폼 높이 조정.
- 필요 시 프롬프트/섹션 길이 미세 조정.
