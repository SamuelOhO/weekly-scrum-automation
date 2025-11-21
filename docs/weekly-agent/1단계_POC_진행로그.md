# 1단계 POC 진행 로그

- [x] 0. 환경 준비: Vite React+TS 프로젝트 초기화, .env.local 템플릿 작성
- [x] 1. 타입/유틸 구현: 타입 정의, 주간 계산, localStorage 헬퍼, 프롬프트 빌더
- [x] 2. 전역 스타일/레이아웃: 색 토큰/리셋/카드/버튼/인풋 스타일
- [x] 3. 컴포넌트 구현: Header, EntryForm, EntryList, SummaryPanel
- [x] 4. App 상태/핸들러 조립: CRUD, thisWeek 필터, 요약 트리거 (이미지 첨부 포함)
- [x] 5. OpenAI 연동: 요약 호출, 로딩/에러/복사 처리 → 현재는 Claude 프록시로 대체 (이미지 VLM 지원)
- [x] 6. QA 및 다듬기: 시나리오 테스트, 반응형/여백 조정(빌드 검증 완료)

## 이슈/메모
- PowerShell에서 cd ... && npm install 구문이 동작하지 않아 cd ...; npm install로 실행.
- Vite 템플릿에 React 의존성이 없어서 빌드 실패 → eact, eact-dom, @types/react, @types/react-dom 설치 후 tsconfig에 "jsx": "react-jsx" 추가해 해결.
- 브라우저에서 Claude API 직접 호출 시 CORS 차단 → 로컬 프록시(
pm run proxy) + Vite dev 서버 프록시(/api/claude → http://localhost:8787) 구성. 브라우저 단에서는 VITE_CLAUDE_API_KEY가 필요 없고, 프록시에 CLAUDE_API_KEY 환경변수로 키를 주입.
- 프롬프트 외부화: poc-app/prompts/week_summary.txt를 system prompt로 사용. 날짜 순서와 주간 맥락을 반영하도록 지시 추가.
- Vite dev 서버 host/port 고정: host: true, port: 5174로 설정해 LAN IP(http://10.100.150.70:5174)에서도 접근 가능.
- 일부 환경에서 crypto.randomUUID가 없어 저장 에러 발생 → UUID 유틸(fallback) 추가해 해소.
- 이미지 첨부 지원: 데일리 입력에 이미지 여러 장을 추가해 저장/삭제 가능. 프록시가 base64 이미지를 Claude VLM으로 전달해 텍스트+이미지 요약 생성.

