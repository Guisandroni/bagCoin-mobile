# BACKCOIN CONTEXT (CAVEMAN ULTRA)

## STACK
- Backend: Python 3.12 + FastAPI + SQLModel (Postgres 16) + Celery + Redis + SlowAPI
- Agent: LangGraph + ChatGroq (Llama 3.3/3.2) + Tavily
- Frontend: Next.js 16 (App Router) + React 19 + Bun + Tailwind v4
- Messaging: whatsapp-web.js + Fastify + TypeScript + MongoDB (WA bridge) + Green API (TG)

## ARCH (MONOREPO)
- `/apps/server`: API. Port 8001 (Host) -> 8000 (Docker).
- `/apps/worker`: Celery worker (processa agent async).
- `/apps/web`: Web Onboarding. Port 3000.
- `/apps/whatsapp`: WA bridge (TypeScript + Fastify). Port 3002.
- `/docker-compose.yml`: DB (5432) + Redis (6379) + MongoDB (27017) + Server + Worker + Web + WhatsApp.

## CORE LOGIC
- Auth: Web gen token → User send to Bot → Bot link `chatId` to `user_id`.
- Multi-Agent: `router` → `audio/image/pdf/chat/query/report/research`.
- DB: `"transaction"` table (RESERVED WORD → ALWAYS QUOTE).
- Cross-Platform: `thread_id` = `{platform}:{chatId}`.

## API ENDPOINTS
- `POST /users/pre-register`: Gen secure token + save user (pending).
- `POST /webhook/whatsapp`: WA incoming messages (from bridge).
- `POST /webhook/green-api`: WA incoming messages (legacy).
- `POST /webhook/telegram`: TG incoming messages.

## DEV
- Env: Server (`.env`), Web (`.env.local`).
- Build: `docker-compose up -d --build`.
- Test: `uv run pytest`.

## STATUS
- CORS: Fixed (*).
- TG: Integrated.
- WA: Integrated via whatsapp-web.js bridge with MongoDB session (cloud-ready).
- Token: Backend gen.
- Tasks: Celery + Redis for agent processing.
- Health: Real health check (DB + Redis + Bridge).
- Rate Limit: 30 req/min webhooks, 5 req/min pre-register.
- Cache: Redis 5min TTL for agent responses.
- Logs: Structlog JSON for observability.
- DB Pool: 10 connections, 20 overflow.
