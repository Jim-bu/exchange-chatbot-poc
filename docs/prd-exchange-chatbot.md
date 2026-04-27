# PRD — Self-Service Exchange Kiosk Support Chatbot

**Version:** 1.0.0  
**Status:** POC (Proof of Concept)  
**Last Updated:** 2026-04-27

---

## 1. Overview

A web-based AI support chatbot embedded at the point of use for self-service foreign currency exchange kiosks. Customers scan a QR code on the kiosk and land on the chat interface to get immediate answers or connect to a human agent.

### Problem

- Kiosk users encounter issues (scan failures, rejected notes, amount confusion) with no immediate help available
- Human agents cannot be at every kiosk location 24/7
- Routing every inquiry to human support is expensive and slow

### Solution

An AI-first, template-constrained chatbot that:
1. Resolves informational questions instantly with approved responses
2. Collects structured information and hands off financial/unresolved cases to a human agent via webhook
3. Never generates free-form or speculative answers

---

## 2. Target Users

| User | Description |
|------|-------------|
| **Primary** | Foreign nationals using the currency exchange kiosk (tourists, travelers) |
| **Secondary** | Support agents receiving escalation notifications |
| **Internal** | Operators managing chatbot content via admin panel |

---

## 3. Scope (POC)

### In Scope
- AI intent classification and template-based response
- 4-step structured info collection before agent handoff
- Webhook notification to support agent channel (Jandi/Slack-compatible)
- Mobile-first chat UI accessible via QR code
- Admin panel for editing knowledge and policy data

### Out of Scope
- Transaction processing or refund execution
- Real-time kiosk machine integration
- Multi-session user identification
- Analytics dashboard

---

## 4. Functional Requirements

### 4.1 Chat Interface

| # | Requirement |
|---|-------------|
| F-01 | On load, display a greeting message identifying the service as AI-powered |
| F-02 | Accept free-text input from the user |
| F-03 | Send message history with each request to maintain context |
| F-04 | Display bot responses with an AI badge (avatar + "AI" label) |
| F-05 | Show loading state while awaiting API response |
| F-06 | Prevent iOS Safari zoom on input focus (font-size ≥ 16px) |

### 4.2 AI Response Engine

| # | Requirement |
|---|-------------|
| F-07 | Classify user intent using GPT-4o-mini with a structured JSON output schema |
| F-08 | Map classification output to one of 5 response categories (see §6) |
| F-09 | Return only pre-approved template text — no free-form generation |
| F-10 | Fall back to local rule-based classifier if OpenAI API is unavailable |
| F-11 | Handle ambiguous input with a single clarifying question |
| F-12 | Immediately escalate high-risk intents without attempting resolution |

### 4.3 Agent Escalation Flow

| # | Requirement |
|---|-------------|
| F-13 | Trigger escalation flow when AI returns `action: "escalate"` or when user explicitly requests a human |
| F-14 | Replace the chat input with a bottom-sheet overlay during collection |
| F-15 | Collect 4 structured fields in sequence (location → currency/amount → problem → photo) |
| F-16 | Add user answers to the message history for transcript continuity |
| F-17 | Send compiled info + full conversation history to the agent webhook |
| F-18 | Display legal notice (산업안전보건법 제41조) on successful handoff |
| F-19 | Show confirmation state after handoff; disable further input |

### 4.4 Admin Panel

| # | Requirement |
|---|-------------|
| F-20 | Provide a password-free internal panel at `/admin` |
| F-21 | Allow viewing and editing of 5 data files: Knowledge Base, AI Policy, Specific Rules, Escalation Rules, AI Guidelines |
| F-22 | Validate JSON before write; reject invalid JSON with an error message |

---

## 5. Non-Functional Requirements

| Category | Requirement |
|----------|-------------|
| **Availability** | Kiosk chat accessible 24/7; human support hours 08:00–17:00 KST |
| **Latency** | AI response target: < 3s under normal load |
| **Security** | OpenAI API key protected via environment variable; not exposed to client |
| **Privacy** | No user PII stored server-side; conversation exists only in browser session |
| **Accessibility** | Mobile-first; full-screen on phones, phone-frame on desktop |
| **Internationalization** | Kiosk: KO/EN/ZH/JA; Chatbot: English (current POC) |

---

## 6. AI Response Architecture

### Response Categories

```
direct_answer
  └── Safe informational response from approved templates
      Intents: service_intro, business_hours, supported_languages,
               exchange_rate_basis, rounding_rule, basic_usage

guided_check
  └── First-step troubleshooting steps only
      Intents: banknote_not_accepted, passport_scan_failed,
               screen_stuck, qr_access_issue

clarify
  └── Single narrowing question when input is ambiguous
      Triggers: short/vague input, multi-issue messages,
                ambiguous money/rate/machine references

answer_then_escalate
  └── Provide guidance, then direct to support
      Intents: same as guided_check + amount_general_explanation

immediate_escalation
  └── No resolution attempt — collect info and hand off
      Intents: money_not_reflected, refund_request, duplicate_charge,
               amount_issue_individual_case, transaction_result_check,
               complaint_or_claim, human_agent_request
```

### Classification Pipeline

```
User input
    │
    ▼
[GPT-4o-mini]
  • Receives: system prompt (policy + templates + knowledge)
  • Returns: JSON { predicted_category, response_template_id,
                    clarify_template_key, needs_human,
                    show_support_link, required_case_info }
    │
    ▼
[Route.ts — server]
  • Looks up template text by ID
  • Never sends GPT-generated text to client
    │
    ▼
[Client]
  • Renders template response
  • Triggers escalation overlay if action === "escalate"
```

### 18 Supported Intents

| Intent | Category |
|--------|----------|
| service_intro | direct_answer |
| basic_usage | direct_answer |
| business_hours | direct_answer |
| supported_languages | direct_answer |
| exchange_rate_basis | direct_answer |
| rounding_rule | direct_answer |
| amount_general_explanation | answer_then_escalate |
| banknote_not_accepted | answer_then_escalate |
| passport_scan_failed | answer_then_escalate |
| screen_stuck | answer_then_escalate |
| qr_access_issue | answer_then_escalate |
| money_not_reflected | immediate_escalation |
| refund_request | immediate_escalation |
| duplicate_charge | immediate_escalation |
| amount_issue_individual_case | immediate_escalation |
| transaction_result_check | immediate_escalation |
| complaint_or_claim | immediate_escalation |
| human_agent_request | immediate_escalation |

---

## 7. User Flow

### 7.1 Informational Query (Happy Path)

```
User scans QR → Chat loads with greeting
    │
    ▼
User types question
    │
    ▼
AI classifies → direct_answer or guided_check
    │
    ▼
Server returns template text
    │
    ▼
User reads answer ──► End (resolved)
```

### 7.2 Ambiguous Input

```
User types short/vague message (e.g. "money")
    │
    ▼
AI classifies → clarify
    │
    ▼
Bot asks single narrowing question
    │
    ▼
User clarifies → re-classify → answer or escalate
```

### 7.3 Escalation Flow

```
AI returns action: "escalate"  (or user asks for human)
    │
    ▼
Chat input replaced by bottom-sheet overlay
    │
    ▼
Step 1: "What store/location?"         → user answers → added to history
Step 2: "Currency and amount?"         → user answers → added to history
Step 3: "Describe the issue"           → user answers → added to history
Step 4: "Photo or screenshot?"         → user answers → added to history
    │
    ▼
POST /api/escalate
  { messages: full history, info: { location, currencyAndAmount, problem, photo } }
    │
    ├── Webhook success → Show legal notice + "Agent will follow up" confirmation
    │                     Phase: "connected" — input disabled
    │
    └── Webhook fail / not configured → Show error, prompt to contact support directly
```

### 7.4 Agent Webhook Payload (Jandi-compatible)

```json
{
  "body": "🔔 Customer Support Request — 2026. 04. 27. 14:30",
  "connectColor": "#E8534F",
  "connectInfo": [
    { "title": "📍 Location",            "description": "..." },
    { "title": "💱 Currency / Amount",   "description": "..." },
    { "title": "⚠️ Issue",              "description": "..." },
    { "title": "📸 Photo / Screenshot", "description": "..." },
    { "title": "💬 Conversation History","description": "[Customer] ...\n[Bot] ..." }
  ]
}
```

---

## 8. Data Model

### 8.1 Message

```ts
interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  showSupportLink?: boolean;
  requiredCaseInfo?: string[];
  timestamp: Date;
}
```

### 8.2 Chat Phase State Machine

```
"chat"
  │  AI returns action: "escalate"
  ▼
"collecting"  ──── user completes 4 steps ──►  "submitting"
                                                    │
                                          webhook success │ fail
                                                    ▼      ▼
                                               "connected"  (error shown)
```

### 8.3 Escalation Info

```ts
interface EscalationInfo {
  location: string;
  currencyAndAmount: string;
  problem: string;
  photo: string;
}
```

---

## 9. Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 16.2.4 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS v4 |
| AI Model | OpenAI GPT-4o-mini |
| Hosting | Vercel (free tier) |
| Agent Notification | Webhook (Jandi / Slack compatible) |
| Data Storage | JSON files in `/data` (file-system based) |
| State | React `useState` — no external store |

---

## 10. API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/chat` | AI classification + template lookup |
| POST | `/api/escalate` | Send escalation info to agent webhook |
| GET | `/api/admin/data?file=<name>` | Read a data file |
| PUT | `/api/admin/data?file=<name>` | Write a data file (JSON validated) |

---

## 11. Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `OPENAI_API_KEY` | Yes | GPT-4o-mini API key |
| `AGENT_WEBHOOK_URL` | No | Webhook URL for agent notifications |

---

## 12. Supported Currencies (17)

USD · JPY · HKD · SGD · AUD · CAD · GBP · NZD · EUR · CHF · CNY · TWD · THB · MYR · PHP · VND · IDR

---

## 13. Design Constraints

- **Template-only responses**: GPT never generates visible text. All customer-facing content comes from `ai_policy.json` templates.
- **No PII storage**: No user data is persisted beyond the browser session.
- **Fail-safe fallback**: If OpenAI is unavailable, a local keyword classifier handles routing.
- **Korean legal compliance**: Agent handoff includes 산업안전보건법 제41조 notice.

---

## 14. Known Limitations (POC)

- Single language UI (English only) — multilingual chatbot not yet implemented
- No session persistence across page refreshes
- Admin panel has no authentication
- Kiosk hours are hardcoded; no live machine status integration
- `AGENT_WEBHOOK_URL` must be manually configured per deployment
