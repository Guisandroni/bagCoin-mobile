# BagCoin — Assistente Financeiro Multi-Agente

**BagCoin** é um chatbot financeiro pessoal que opera via **WhatsApp** e **Telegram**, utilizando um sistema multi-agente com **LangGraph** para classificar intenções, extrair dados, consultar finanças e gerar relatórios — tudo em **português brasileiro**.

---

## Objetivo

Permitir que qualquer pessoa gerencie suas finanças pessoais de forma **conversacional**, enviando mensagens de texto, áudio ou extrato bancário. O BagCoin interpreta linguagem natural para:

- Registrar receitas e despesas
- Criar e acompanhar orçamentos mensais
- Definir metas de economia
- Consultar gastos por categoria/período
- Importar extratos bancários automaticamente
- Gerar relatórios financeiros em PDF
- Recomendar estratégias de economia/investimento

---

## Stack Tecnológica

| Camada | Tecnologia | Justificativa |
|--------|-----------|---------------|
| **API** | FastAPI + Pydantic v2 | Assíncrono nativo, validação automática, OpenAPI |
| **Banco** | PostgreSQL 16 (async) | Dados financeiros relacionais, JSONB, confiabilidade |
| **ORM** | SQLAlchemy 2.0 + Alembic | Migrations versionadas, queries type-safe |
| **Cache** | Redis 7 | Deduplicação de mensagens, cache de sessão |
| **LLM** | Groq (primário) + OpenCode (fallback) | Classificação e extração por IA |
| **Agentes** | LangGraph + LangChain | Orquestração multi-agente com grafo de estado |
| **Tarefas** | Celery + Redis | Processamento em background (PDF, importação CSV) |
| **IA Tools** | LangChain Groq, DuckDuckGo, Tavily | Pesquisa web, deep research |
| **PDF** | ReportLab + Pillow | Geração de relatórios financeiros |
| **Auth** | JWT + API Key | Dupla camada de segurança |
| **Observab.** | Logfire | Tracing e monitoramento |
| **Container** | Docker Compose | 7 serviços orquestrados |
| **Ger. Pacotes** | uv (Ruff, pytest) | Instalação e qualidade de código |

---

## Estrutura do Projeto

```
bagcoin_api/
├── apps/server/
│   ├── app/
│   │   ├── main.py              # Entrypoint FastAPI
│   │   ├── core/
│   │   │   ├── config.py        # Settings (pydantic-settings)
│   │   │   ├── security.py      # JWT + API Key
│   │   │   └── exceptions.py    # Domínio de exceções
│   │   ├── db/
│   │   │   ├── models/          # SQLAlchemy models
│   │   │   │   ├── phone_user.py
│   │   │   │   ├── transaction.py
│   │   │   │   ├── category.py
│   │   │   │   ├── budget.py
│   │   │   │   ├── goal.py
│   │   │   │   ├── report.py
│   │   │   │   └── agent_log.py
│   │   │   └── session.py       # Async engine + sessions
│   │   ├── repositories/        # Data access layer
│   │   │   ├── phone_user.py
│   │   │   ├── transaction.py
│   │   │   ├── category.py
│   │   │   ├── budget.py
│   │   │   ├── goal.py
│   │   │   └── agent_log.py
│   │   ├── services/            # Business logic
│   │   │   ├── llm_service.py   # LLM provider routing
│   │   │   ├── whatsapp_service.py
│   │   │   └── pdf_generator.py
│   │   ├── agents/              # Multi-agent LangGraph
│   │   │   ├── orchestrator.py  # StateGraph principal
│   │   │   ├── ingestion.py     # Classificação de intenção (LLM)
│   │   │   ├── normalization.py # Extração de dados financeiros
│   │   │   ├── persistence.py   # Salvamento + histórico
│   │   │   ├── text_to_sql.py   # Consultas em linguagem natural
│   │   │   ├── budget_goal.py   # Orçamentos e metas
│   │   │   ├── reports.py       # Geração de relatórios
│   │   │   ├── recommendations.py
│   │   │   ├── deep_research.py # Pesquisa de mercado/investimento
│   │   │   ├── statement_parser.py  # Parse de extratos
│   │   │   ├── import_statement.py  # Importação de transações
│   │   │   ├── wizard.py        # Fluxos guiados
│   │   │   ├── multimodal.py    # Áudio/imagem/documento
│   │   │   ├── responses.py     # Templates de resposta
│   │   │   └── prompts.py       # System prompts
│   │   ├── api/
│   │   │   ├── routes/v1/
│   │   │   │   ├── webhook.py   # Webhook WhatsApp/Telegram
│   │   │   │   ├── auth.py
│   │   │   │   ├── users.py
│   │   │   │   └── ...
│   │   │   └── deps.py          # Dependências (auth, db)
│   │   ├── schemas/             # Pydantic models
│   │   │   ├── enums.py
│   │   │   ├── common.py
│   │   │   ├── transaction.py
│   │   │   └── ...
│   │   └── commands/            # CLI (uv run bagcoin_api ...)
│   ├── alembic/                 # Migrations
│   ├── tests/
│   └── pyproject.toml
├── telegram-bridge/
│   └── bot.py                   # Bot Telegram (polling)
├── whatsapp-bridge/
│   ├── index.js                 # Bridge WhatsApp (Baileys)
│   └── package.json
├── docker-compose.yml           # 7 serviços
├── docker-compose.prod.yml      # Produção com Traefik
├── Makefile                     # Comandos de desenvolvimento
└── docs/
    ├── architecture.md
    ├── patterns.md
    └── howto/
```

---

## Sistema Multi-Agente (LangGraph)

O coração do BagCoin é um **StateGraph** com nós condicionais:

```
Mensagem → Classify Intent → Roteamento Condicional
                                 │
                    ┌────────────┼────────────┬──────────────┐
                    ▼            ▼            ▼              ▼
              Register     Query Data   Create Budget   Import Statement
              Expense/     (Text→SQL)   /Goal           (Extrato)
              Income                                   
                    │            │            │              │
                    ▼            ▼            ▼              ▼
              Save TX      Format        Persist        Parse + Save
                          Response
                    │            │            │              │
                    └────────────┴────────────┴──────────────┘
                                        ▼
                                  Resposta Final
```

### Intenções Suportadas (16+ categorias)

- **register_expense**: "gastei 50 no mercado", "uber 12 reais"
- **register_income**: "recebi 5000 de salário"
- **query_data**: "quanto gastei esse mês?", "gastos por categoria"
- **create_budget / create_goal**: "definir orçamento de 5000", "quero guardar 10000"
- **contribute_goal**: "guardei 500 na meta viagem"
- **import_statement**: importar extrato bancário (CSV/PDF)
- **generate_report**: "gerar relatório", "pdf do mês"
- **recommendation / deep_research**: dicas de economia/investimento
- **chat / greeting / help**: conversa livre, saudação, tutorial
- **E mais**: delete/update de transações, budgets, goals, categorias

---

## Modelos de Dados

### PhoneUser
Usuário do sistema financeiro, identificado por número de telefone ou Telegram chat ID. Contém preferências e perfil financeiro em JSON.

### Transaction
Registro financeiro com tipo (receita/despesa), valor, categoria, descrição, data, origem (texto/áudio/imagem/documento) e score de confiança da IA.

### Category
Categorias personalizadas por usuário (ex: Alimentação, Transporte, Lazer).

### Budget
Orçamento mensal com limite por categoria, controle de período e alertas em 80% e 100% do limite.

### Goal
Meta financeira com valor alvo, valor atual, prazo e status (ativo/completo/cancelado).

### Report / AgentLog
Relatórios PDF gerados e log de execução dos agentes para auditoria.

---

## Fluxo de Mensagem

```
WhatsApp/Telegram
      ↓
  Bridge (Baileys / python-telegram-bot)
      ↓
  Webhook API → Deduplicação (Redis) → Orquestrador LangGraph
      ↓
  Classificador (LLM) → Extração → Processamento → Persistência
      ↓
  Resposta formatada → Bridge → Usuário
```

### Camadas do Webhook

1. **Normalização**: limpa número de telefone (remove sufixos)
2. **Deduplicação**: evita processar mesma mensagem duas vezes (Redis TTL 60s)
3. **Validação**: API Key + formato da mensagem
4. **Orquestração**: chama o LangGraph AgentState
5. **Resposta**: retorna mensagem + ações sugeridas

---

## Provedores de LLM

| Provider | Modelo | Prioridade | API Key |
|----------|--------|------------|---------|
| Groq | `llama-3.3-70b-versatile` | 🥇 Primário | `GROQ_API_KEY` |
| OpenCode | `deepseek-v4-flash` | 🥈 Fallback | `OPENCODE_API_KEY` |
| DeepSeek | `deepseek-v4-flash` | 🥉 Terciário | `DEEPSEEK_API_KEY` |

O roteamento entre providers é feito pelo serviço `llm_service.py`, que tenta cada provider em ordem até obter resposta.

---

## Serviços Docker (7)

| Serviço | Porta | Função |
|---------|-------|--------|
| **app** | `8000` | API FastAPI (hot reload) |
| **db** | `5432` | PostgreSQL 16 |
| **redis** | `6379` | Cache + Celery broker |
| **celery_worker** | — | Tarefas em background |
| **celery_beat** | — | Agendador periódico |
| **flower** | `5555` | Monitoramento Celery |
| **whatsapp-bridge** | `3001` | Bridge Baileys WhatsApp |
| **telegram-bridge** | — | Bot Telegram (polling) |

---

## Requisitos de Sistema

### Desenvolvimento

- Python ≥ 3.11
- Docker + Docker Compose v2
- Node.js ≥ 18 (WhatsApp bridge)
- PostgreSQL 16 (local ou container)
- Redis 7 (local ou container)
- Chaves de API: Groq, OpenCode (ou DeepSeek), Tavily

### Produção

- Docker + Docker Compose + Traefik (reverse proxy)
- PostgreSQL 16 gerenciado
- Redis 7 gerenciado
- Variáveis de ambiente configuradas (sem `.env`)
- Volumes persistentes para mídia, relatórios e dados do WhatsApp

---

## Comandos Principais

```bash
make install        # Instalar dependências
make quickstart     # Setup completo (Docker + DB + admin)
make run            # Servidor dev (hot reload)
make test           # Rodar testes
make lint           # Qualidade de código
make db-upgrade     # Aplicar migrations
make docker-up      # Iniciar serviços Docker
make create-admin   # Criar usuário admin
```

---

## Configuração (.env)

```bash
# Banco de Dados
POSTGRES_HOST=localhost
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_DB=bagcoin

# Chaves de API
GROQ_API_KEY=gsk_...
OPENCODE_API_KEY=sk-...
DEEPSEEK_API_KEY=sk-...
TAVILY_API_KEY=tvly-...
TELEGRAM_BOT_TOKEN=...

# LLM
DEFAULT_LLM_MODEL=deepseek-v4-flash

# WhatsApp Bridge
WHATSAPP_BRIDGE_URL=http://whatsapp-bridge:3001
WHATSAPP_API_KEY=bagcoin_webhook_secret_123

# Autenticação
API_KEY=bagcoin_webhook_secret_123
SECRET_KEY=openssl-rand-hex-32
```

---

## Testes

O projeto possui testes abrangentes organizados por camada:

```bash
apps/server/tests/
├── api/           # Testes de endpoints
├── conftest.py    # Fixtures compartilhadas
├── test_agents.py
├── test_services.py
├── test_repositories.py
├── test_migrations.py
└── ...
```

```bash
make test           # Todos os testes
make test-cov       # Com cobertura HTML
```

---

## Segurança

- **JWT** com refresh tokens para frontend
- **API Key** via header `X-API-Key` para bridges
- **IDOR Protection**: resources escopados por `user_id`
- **Rate limiting** via Redis (deduplicação)
- **Role-based**: ADMIN e USER
- **PII redaction** nos logs (GDPR)
- **Secret scanning** no git (GitHub push protection)
