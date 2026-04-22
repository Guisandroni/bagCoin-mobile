# GEMINI.md - Project Context & instructions

## Project Overview
**Backcoin** is a multi-agent financial assistant monorepo. It leverages AI agents to automate personal finance management via WhatsApp and Telegram. The system is designed for high-quality data extraction from various formats (text, audio, images, PDFs) and provides natural language analytical queries.

### Architecture
- **Monorepo Structure**:
  - `apps/server`: Python FastAPI backend.
  - `apps/web`: Next.js 16 (React 19) frontend.
  - `apps/whatsapp`: TypeScript bridge using **whatsapp-web.js** + **Fastify** for WhatsApp integration.
- **Orchestration**: Uses **LangGraph** to manage conversational state and multi-agent routing.
- **Intelligence**: Powered by **Groq** (Llama 3.3 for reasoning, Llama 3.2 for Vision) and **Whisper** for voice transcription.
- **Persistence**: **PostgreSQL** with **SQLModel** ORM.
- **Queue / Cache**: **Redis** + **Celery** for background task processing and caching.
- **Rate Limiting**: **SlowAPI** protects webhooks against abuse.
- **Observability**: **Structlog** JSON logs for production monitoring.
- **Search**: **Tavily API** for real-time web research and financial advice.
- **Messaging**:
  - **WhatsApp**: `whatsapp-web.js` + `Fastify` + `TypeScript` (bridge on port 3002). Uses `MongoAuth` with MongoDB for session persistence (cloud-ready, no SingletonLock issues).
  - **Telegram**: Green API (legacy, optional).
- **Task Processing**: Agent message processing runs via **Celery workers** (async, retry, non-blocking).

## Building and Running

### Core Commands
- **Full Stack (Docker)**: `docker-compose up -d --build`
- **Backend Development**:
  - Location: `apps/server`
  - Command: `uv run uvicorn src.main:app --host 0.0.0.0 --port 8001 --reload`
  - Environment: Requires `.env` with keys for Groq, Tavily, and `WHATSAPP_BRIDGE_URL`.
- **Frontend Development**:
  - Location: `apps/web`
  - Command: `bun run dev`
  - Environment: Requires `.env.local` with `NEXT_PUBLIC_API_URL`.
- **WhatsApp Bridge Development**:
  - Location: `apps/whatsapp`
  - Stack: TypeScript + Fastify
  - Commands: `npm run dev` (dev) / `npm run build` (build) / `npm start` (prod)
  - Environment: Requires `.env` with `API_URL` pointing to the backend.
- **Worker (Celery)**:
  - Location: runs as `worker` service in Docker
  - Command: `uv run celery -A src.celery_app worker --loglevel=info`
  - Processes all agent message tasks asynchronously
- **Database**:
  - Local Postgres on port `5432` (via Docker).
  - Connection pooling (10 pool, 20 max overflow).
  - Schema managed by SQLModel (`SQLModel.metadata.create_all`).
- **Cache / Queue**:
  - Redis on port `6379` (via Docker).
  - Agent response cache: 5 min TTL for repeated queries.

### Testing
- **Backend Tests**: `PYTHONPATH=. uv run pytest tests/`
- **Integration Tests**: Scripts like `tests/test_end_to_end.py` validate real API flows with Postgres and mock/real LLM calls.

## Development Conventions

### Coding Style
- **Python**: Follows modern FastAPI patterns. Uses Type Hints rigorously. SQLModel is used for both models and Pydantic schemas.
- **Frontend**: Next.js App Router. Uses Tailwind CSS v4 for styling. Custom hooks (e.g., `useAuth`) manage complex logic.
- **Agents**: Logic is isolated in `src/agents/nodes.py`. All agent state must be defined in `src/agents/state.py`.

### Critical Logic & Security
- **Authentication**: Gated by an `Activation Token` system. Users must generate a token on the Web and send it to the Bot to link their `chatId` to a `User_ID`.
- **Text-to-SQL**: The `query_node` uses Llama 3.3 to generate SQL. **IMPORTANT**: Always quote the table name `"transaction"` in SQL queries as it is a reserved word in many dialects (including PostgreSQL/SQLite).
- **CORS**: Configured in `main.py` to allow communication from the Next.js frontend.
- **Isolation**: Conversation history is partitioned by `thread_id` using the format `platform:chatId`.

### Folder Structure Highlights
- `apps/server/src/agents/`: Core multi-agent logic (nodes, state, graph).
- `apps/server/src/services/`: External services (PDF reporting, statement parsing, WhatsApp bridge).
- `apps/web/src/components/`: Reusable React components (Atomic design-ish).
- `apps/web/src/hooks/`: Business logic hooks.
- `apps/whatsapp/src/`: WhatsApp Web bridge (`client.ts`, `api.ts`, `index.ts`).
