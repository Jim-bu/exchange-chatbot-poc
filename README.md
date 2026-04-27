# Exchange Kiosk Support Chatbot

AI-powered customer support chatbot for self-service foreign currency exchange kiosks. Customers scan a QR code on the kiosk and get instant answers or connect to a human agent.

→ **[Full PRD](docs/prd-exchange-chatbot.md)**

---

## What it does

- **Classifies** user questions using GPT-4o-mini and routes to pre-approved response templates — no free-form AI text is ever shown to the customer
- **Resolves** informational queries instantly (usage, exchange rates, supported currencies, etc.)
- **Escalates** financial or unresolved issues through a 4-step info collection flow, then notifies a human agent via webhook
- **Admin panel** at `/admin` lets operators edit knowledge base and AI policy without code changes

## Stack

- Next.js 16.2.4 (App Router) · TypeScript · Tailwind CSS v4
- OpenAI GPT-4o-mini
- Vercel (hosting) · Webhook (agent notifications)

## Quick start

```bash
npm install
```

Create `.env.local`:

```env
OPENAI_API_KEY=sk-...
AGENT_WEBHOOK_URL=https://...   # optional — agent notification webhook
```

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Response architecture

All customer-facing text comes from `data/ai_policy.json` templates. GPT only classifies intent and returns a template ID — it never generates visible text.

```
User input → GPT-4o-mini (classify) → template lookup → response
                                              ↓
                               if escalation: 4-step info collection → webhook
```

**5 response categories:** `direct_answer` · `guided_check` · `clarify` · `answer_then_escalate` · `immediate_escalation`

**18 supported intents** covering service info, troubleshooting, and financial issue escalation.

## Key files

```
app/
  api/chat/route.ts       AI classification endpoint
  api/escalate/route.ts   Agent webhook sender
  admin/page.tsx          Admin panel

components/
  ChatWidget.tsx          Main chat + escalation state machine
  ChatMessage.tsx         Message bubble with AI badge

data/
  ai_policy.json          Intent routing rules + response templates
  knowledge.json          Service knowledge base (17 currencies, hours, flow)
  ai_guidelines.json      AI persona and behavior rules

lib/
  ai-context.ts           System prompt builder + template lookup
  classifier.ts           Local fallback classifier (no API required)
```

## Environment variables

| Variable | Required | Description |
|----------|----------|-------------|
| `OPENAI_API_KEY` | Yes | GPT-4o-mini API key |
| `AGENT_WEBHOOK_URL` | No | Webhook URL for agent handoff notifications |

## Supported currencies (17)

USD · JPY · HKD · SGD · AUD · CAD · GBP · NZD · EUR · CHF · CNY · TWD · THB · MYR · PHP · VND · IDR
