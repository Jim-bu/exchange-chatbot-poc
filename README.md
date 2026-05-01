# 무인환전기 고객지원 AI 챗봇

무인환전기 현장에서 QR을 스캔한 외국인 고객이 즉시 도움을 받을 수 있는 모바일 우선 AI 챗봇 POC.

→ **[상세 PRD 보기](docs/prd-exchange-chatbot.md)**

---

## 제품 개요

GPT-4o-mini가 사용자 입력을 intent로 분류하고, 서버가 승인된 템플릿만 반환한다. GPT가 생성한 자유 텍스트는 고객에게 직접 노출되지 않는다.

- **일반 문의** → 즉시 자동응답 (FAQ 18개 intent)
- **금전·거래·환불 이슈** → 4단계 정보 수집 후 상담사 webhook 알림
- **운영자** → `/admin` 패널에서 코드 수정 없이 지식/정책 JSON 편집

## 기술 스택

- Next.js 16.2.4 (App Router) · TypeScript · Tailwind CSS v4
- OpenAI GPT-4o-mini
- Vercel (호스팅) · Webhook (상담사 알림)

## 빠른 시작

```bash
npm install
```

`.env.local` 생성:

```env
OPENAI_API_KEY=sk-...
AGENT_WEBHOOK_URL=https://...   # 선택 — 상담사 알림 webhook URL
```

```bash
npm run dev
```

[http://localhost:3000](http://localhost:3000) 접속

## 응답 아키텍처

```
사용자 입력
    ↓
GPT-4o-mini (intent 분류 → JSON)
    ↓
서버 템플릿 조회 (ai_policy.json)
    ↓
고객에게 템플릿 텍스트만 반환

※ escalation 분기 시:
    ↓
4단계 정보 수집 오버레이 (위치 → 통화/금액 → 문제 → 사진)
    ↓
/api/escalate → webhook 전송
```

**5개 응답 카테고리**

| 카테고리 | 용도 |
|---------|------|
| `direct_answer` | 안전한 FAQ 즉시 응답 |
| `guided_check` | 1차 점검 안내 |
| `clarify` | 짧거나 모호한 입력 명확화 |
| `answer_then_escalate` | 안내 후 support 유도 |
| `immediate_escalation` | 금전·거래·환불·불만 → 즉시 인계 |

## 주요 파일

```
app/
  api/chat/route.ts       AI 분류 엔드포인트
  api/escalate/route.ts   상담사 webhook 전송
  admin/page.tsx          운영자 패널

components/
  ChatWidget.tsx          채팅 UI + escalation 상태머신
  ChatMessage.tsx         메시지 버블 (AI 뱃지 포함)

data/
  ai_policy.json          intent 라우팅 규칙 + 응답 템플릿
  knowledge.json          서비스 지식 베이스 (17개 통화, 운영시간 등)
  ai_guidelines.json      AI 페르소나 및 행동 원칙

lib/
  ai-context.ts           시스템 프롬프트 빌더 + 템플릿 조회
  classifier.ts           로컬 fallback 분류기 (API 불필요)
```

## 환경 변수

| 변수 | 필수 | 설명 |
|------|------|------|
| `OPENAI_API_KEY` | Yes | GPT-4o-mini API 키 |
| `AGENT_WEBHOOK_URL` | No | 상담사 알림 webhook URL |

## 지원 통화 (17종)

USD · JPY · HKD · SGD · AUD · CAD · GBP · NZD · EUR · CHF · CNY · TWD · THB · MYR · PHP · VND · IDR
