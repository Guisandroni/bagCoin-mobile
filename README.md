# bagCoin — Assistente Financeiro Pessoal

[![CI/CD Pipeline](https://github.com/Guisandroni/bagCoin/actions/workflows/test.yml/badge.svg)](https://github.com/Guisandroni/bagCoin/actions/workflows/test.yml)

Assistente financeiro com IA integrada via WhatsApp e Telegram. Gerencie transações, orçamentos, metas e receba relatórios automaticamente.

## Stack

| Componente | Tecnologia |
|-----------|-----------|
| **Backend** | FastAPI + Pydantic v2 + SQLAlchemy async |
| **Frontend** | Next.js 16 + React 19 + Tailwind v4 + shadcn/ui |
| **Database** | PostgreSQL 16 (asyncpg + psycopg2) |
| **Auth** | JWT + API Key + Google OAuth |
| **Cache / Queue** | Redis 7 + Celery (Worker + Beat + Flower) |
| **AI Agent** | LangGraph + Groq (LLM) |
| **Canais** | WhatsApp (whatsapp-web.js) + Telegram (python-telegram-bot) |
| **Testes** | pytest (back) + vitest (front) + Playwright (E2E) |

## Status dos Testes

| Suite | Testes | Status |
|-------|--------|--------|
| Backend (pytest) | **441** | ✅ 100% |
| Frontend (vitest) | **170** | ✅ 100% |
| WhatsApp Bridge (vitest) | **17** | ✅ 100% |
| Playwright E2E | **30/66** | 🔄 45% |

## Quick Start (Docker)

```bash
# Subir ambiente completo
docker compose --profile full up -d

# Verificar containers
docker compose ps

# Rodar testes backend
docker compose exec app python -m pytest tests/api/ -v

# Rodar testes frontend
cd apps/web && npx vitest run

# Rodar testes Playwright
cd apps/web && npx playwright test --project=chromium
```

**Acesso:**
- Frontend: http://localhost:3000
- API: http://localhost:8000
- API Docs: http://localhost:8000/docs
- Flower (Celery): http://localhost:5555

## Serviços Docker

| Serviço | Porta | Profile |
|---------|-------|---------|
| app (backend) | 8000 | default |
| db (PostgreSQL) | 5432 | default |
| redis | 6379 | default |
| web (frontend) | 3000 | default |
| celery_worker | — | full |
| celery_beat | — | full |
| flower | 5555 | full |
| whatsapp-bridge | 3001 | full |
| telegram-bridge | — | full |

## Estrutura

```
apps/
├── server/         # Backend FastAPI
│   ├── app/
│   │   ├── api/routes/v1/    # Endpoints REST
│   │   ├── services/         # Lógica de negócio
│   │   ├── repositories/     # Acesso a dados
│   │   ├── agents/           # Agentes LangGraph
│   │   ├── db/models/        # Modelos SQLAlchemy
│   │   └── schemas/          # Pydantic schemas
│   └── tests/api/            # Testes backend
├── web/             # Frontend Next.js
│   ├── src/
│   │   ├── app/              # Páginas (App Router)
│   │   ├── components/       # Componentes React
│   │   ├── hooks/            # TanStack Query hooks
│   │   └── lib/              # Utilitários
│   └── e2e/                  # Testes Playwright
└── whatsapp-bridge/ # WhatsApp Bridge (Node.js)
```

## Documentação

- `docs/architecture.md` — Arquitetura detalhada
- `docs/deployment.md` — Guia de deploy
- `docs/testing.md` — Estratégia de testes
- `docs/patterns.md` — Padrões de código
- `.hermes/plans/` — Planos de desenvolvimento

## Variáveis de Ambiente

Criar `.env` na raiz do projeto:

```env
# Database
POSTGRES_HOST=db
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_DB=bagcoin

# Redis
REDIS_HOST=redis

# Auth
JWT_SECRET=your-secret-here
API_KEY=bagcoin_api_key_change_me

# Webhook
WHATSAPP_API_KEY=bagcoin_webhook_secret_123

# LLM
GROQ_API_KEY=gsk_your_key_here
DEFAULT_LLM_MODEL=llama-3.1-8b-instant

# Telegram
TELEGRAM_BOT_TOKEN=your_bot_token_here

# Frontend
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
```

## Integrações web — WhatsApp / Telegram

Para o utilizador abrir o WhatsApp ou Telegram **já na conversa do bot**, com o código na mensagem (`wa.me` / `t.me`), o backend precisa de `BOT_WHATSAPP_NUMBER` (só dígitos E.164, ex.: `5511999999999`) e `BOT_TELEGRAM_USERNAME` (username sem `@`), definidos em `apps/server` / `.env`.

Sem estas variáveis, `POST /api/v1/integrations/link-token` responde **422** com código `INTEGRATION_BOT_NOT_CONFIGURED`.

Verificação (sessão autenticada):

```bash
curl -s -X POST "http://localhost:8000/api/v1/integrations/link-token" \
  -H "Authorization: Bearer SEU_JWT" \
  -H "Content-Type: application/json" \
  -d '{"channel":"whatsapp"}'
```

Com o servidor bem configurado, o JSON deve incluir `deeplink_whatsapp` começando por `https://wa.me/`.
