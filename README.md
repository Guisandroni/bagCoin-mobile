# BagCoin - Chatbot Financeiro Multimodal

Chatbot financeiro inteligente via WhatsApp com arquitetura multi-agent, construído com FastAPI, LangGraph, PostgreSQL e WhatsApp Web JS.

---

## 🚀 Quick Start (Docker Compose — Tudo em um comando)

O projeto está completamente containerizado. Com um único comando você sobe:
- **PostgreSQL** (banco de dados)
- **Backend FastAPI** (API + agentes LangGraph)
- **WhatsApp Bridge** (ponte com WhatsApp Web)

### 1. Pré-requisitos
- [Docker](https://docs.docker.com/get-docker/)
- [Docker Compose](https://docs.docker.com/compose/install/)
- Conta [Groq](https://console.groq.com) *(opcional — funciona sem, com funcionalidades reduzidas)*

### 2. Configurar ambiente
```bash
cd /Users/guilherme/dev/bagcoin
cp .env.example .env
# Edite .env e adicione sua GROQ_API_KEY para ativar IA avançada
```

### 3. Subir tudo
```bash
docker-compose up -d --build
```

Pronto! Os serviços estarão disponíveis em:
- **API FastAPI:** http://localhost:8000
- **Documentação:** http://localhost:8000/docs
- **Bridge WhatsApp:** http://localhost:3001

### Interface web (Next.js + Better Auth)

Requer [Bun](https://bun.sh). A web usa um **Postgres dedicado** ([`web/docker-compose.yml`](web/docker-compose.yml)), **porta host 5433**, separado do Postgres da API na raiz (**5432**).

```bash
cd web
docker compose up -d
cp .env.example .env.local
# .env.local: localhost:5433 / bagcoin_web — ajuste BETTER_AUTH_SECRET
bun install
bun run db:push   # aplica web/db/auth-ddl.sql (schema `auth`)
bun dev
```

- **Painel:** http://localhost:3000 — login principal com **Google** (Better Auth). Magic link por e-mail só aparece na UI com `NEXT_PUBLIC_MAGIC_LINK_ENABLED=true` e `RESEND_API_KEY` no servidor; o URL do link **não** é impresso em logs.
- **Google Cloud Console:** crie credencial OAuth 2.0 (aplicação Web). Em **Authorized redirect URIs**, inclua `http://localhost:3000/api/auth/callback/google` em dev e, em produção, `{BETTER_AUTH_URL}/api/auth/callback/google`. Preencha `GOOGLE_CLIENT_ID` e `GOOGLE_CLIENT_SECRET` no `.env.local` (secret só no servidor).
- Credenciais por defeito: `bagcoin_web` / `bagcoin_web123` / base `bagcoin_web` — variáveis `POSTGRES_WEB_*` em [`web/docker-compose.yml`](web/docker-compose.yml).
- As tabelas do Better Auth ficam no **schema `auth`** dentro da base `bagcoin_web`.
- Os dados de telas (transações, etc.) são **mock** até existir API REST no FastAPI.
- **Não uses** `drizzle-kit push` para esta base (pode propor `DROP SCHEMA auth`); usa `bun run db:push`. Opcional: `bun run db:push:drizzle`.

### 4. Conectar ao WhatsApp
Acompanhe os logs da bridge e escaneie o QR Code:
```bash
docker logs -f bagcoin-whatsapp-bridge
```

### 5. Parar tudo
```bash
docker-compose down
```

Para remover também os volumes (apaga dados do banco e sessão do WhatsApp):
```bash
docker-compose down -v
```

---

## 🧪 Testar sem WhatsApp

Execute o script de teste que conversa diretamente com a API:
```bash
# Usando o container do backend
docker exec bagcoin-backend python -c "
from fastapi.testclient import TestClient
from app.main import app
client = TestClient(app)

# Teste: registrar um gasto
r = client.post('/webhook/whatsapp', json={
    'phone_number': '5511999999999',
    'message': 'Gastei R$ 42 no mercado',
    'type': 'chat',
    'timestamp': 1715000000,
    'hasMedia': False
}, headers={'X-API-Key': 'bagcoin_webhook_secret_123'})
print('Status:', r.status_code)
print('Resposta:', r.json()['reply'])
"
```

Ou via curl:
```bash
curl -X POST http://localhost:8000/webhook/whatsapp \
  -H "Content-Type: application/json" \
  -H "X-API-Key: bagcoin_webhook_secret_123" \
  -d '{
    "phone_number": "5511999999999",
    "message": "Recebi R$ 5000 de salário",
    "type": "chat",
    "timestamp": 1715000000,
    "hasMedia": false
  }'
```

---

## 🏗️ Arquitetura

```
┌─────────────┐     ┌──────────────┐     ┌─────────────────┐
│  WhatsApp   │────▶│ WhatsApp JS  │────▶│  FastAPI        │
│   Usuário   │     │   Bridge     │     │  (Webhook)      │
└─────────────┘     └──────────────┘     └─────────────────┘
                                                  │
                                                  ▼
                                        ┌─────────────────┐
                                        │  LangGraph      │
                                        │  Orquestrador   │
                                        └─────────────────┘
                                                  │
                    ┌─────────┬─────────┬─────────┼─────────┬─────────┐
                    ▼         ▼         ▼         ▼         ▼         ▼
                ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐
                │Ingest│ │Normal│ │Persis│ │Text2 │ │Report│ │Recom │
                │ão    │ │ização│ │tência│ │SQL   │ │s     │ │endações
                └──────┘ └──────┘ └──────┘ └──────┘ └──────┘ └──────┘
                                                  │
                                                  ▼
                                        ┌─────────────────┐
                                        │   PostgreSQL    │
                                        └─────────────────┘
```

---

## 📁 Estrutura do Projeto

```
bagcoin/
├── docker-compose.yml          # Orquestração de todos os serviços
├── .env                        # Variáveis de ambiente
├── .env.example                # Template de variáveis
├── README.md                   # Este arquivo
├── backend/
│   ├── app/
│   │   ├── main.py             # FastAPI app
│   │   ├── config.py           # Configurações (Pydantic Settings)
│   │   ├── database.py         # SQLAlchemy engine + init
│   │   ├── models/             # Modelos do banco (Users, Transactions, etc.)
│   │   ├── agents/             # Orquestrador LangGraph + subagentes
│   │   │   ├── orchestrator.py # Grafo de orquestração
│   │   │   ├── ingestion.py    # Classificação de intenção
│   │   │   ├── normalization.py# Extração de dados financeiros
│   │   │   ├── persistence.py  # Persistência em PostgreSQL
│   │   │   ├── text_to_sql.py  # NL → SQL seguro
│   │   │   ├── reports.py      # Geração de relatórios
│   │   │   ├── recommendations.py # Dicas financeiras
│   │   │   └── deep_research.py   # Pesquisa aprofundada
│   │   ├── routers/            # Endpoints API
│   │   ├── services/           # Serviços (LLM, PDF, WhatsApp)
│   │   └── schemas/            # Pydantic schemas
│   ├── scripts/
│   │   └── entrypoint.sh       # Espera PostgreSQL antes de iniciar
│   ├── reports/                # PDFs gerados (volume Docker)
│   ├── requirements.txt
│   └── Dockerfile
├── whatsapp-bridge/
│   ├── index.js                # WhatsApp Web bridge
│   ├── package.json
│   └── Dockerfile              # Com Chromium para Puppeteer
└── docs/
```

---

## 🎯 Funcionalidades

### MVP (Fase 1) — ✅ Pronto
- [x] Registro de gastos e receitas por texto
- [x] Classificação automática de intenção (fallback sem LLM)
- [x] Extração de valor, categoria e descrição
- [x] Persistência em PostgreSQL com tipos ENUM
- [x] Consultas por linguagem natural (fallback com padrões mapeados)
- [x] Geração de relatórios PDF
- [x] Respostas amigáveis formatadas para WhatsApp
- [x] Orquestração multi-agent com LangGraph

### Fase 2 — Multimodal
- [ ] Processamento de áudio (transcrição)
- [ ] OCR em imagens (comprovantes, notas)
- [ ] Leitura de documentos

### Fase 3 — Inteligência Financeira
- [ ] Orçamentos e metas
- [ ] Recomendações personalizadas (requer Groq API)
- [ ] Perfil financeiro do usuário

### Fase 4 — Relatórios e Pesquisa
- [ ] Deep research com busca na web (requer Groq API)
- [ ] Análises comparativas mensais

---

## 🔑 Configurando a API Groq (Opcional)

Sem a Groq API, o sistema funciona com **fallbacks baseados em regex e palavras-chave**. Com a API, você ativa:
- Classificação de intenção com LLM
- Extração avançada de entidades
- Text-to-SQL dinâmico (qualquer pergunta em linguagem natural)
- Recomendações financeiras personalizadas
- Deep research contextualizado

1. Crie uma conta em https://console.groq.com
2. Gere uma API Key
3. Edite o `.env`:
```
GROQ_API_KEY=gsk_sua_chave_aqui
```
4. Reinicie os containers:
```bash
docker-compose up -d --build
```

---

## 📝 Exemplos de Uso

| Você envia no WhatsApp | O bot responde |
|-----------|----------------|
| `"Oi"` | Saudação e menu de opções |
| `"Gastei R$ 35 no almoço"` | Confirma registro em *Alimentação* |
| `"Recebi R$ 5000 de salário"` | Confirma registro de *receita* |
| `"Quanto gastei esse mês?"` | Total de despesas do mês |
| `"Gastos por categoria"` | Lista categorias e valores |
| `"Qual meu saldo?"` | Receitas − Despesas |
| `"Gere um relatório"` | PDF com resumo financeiro |
| `"Ajuda"` | Menu de comandos disponíveis |

---

## 🛡️ Segurança

- Validação de API Key (`X-API-Key`) no webhook
- SQL whitelist — **apenas SELECT** permitido no text-to-SQL
- Sanitização de inputs do usuário
- Isolamento de dados por `phone_number`
- Enum types no PostgreSQL para consistência
- Queries parametrizadas (psycopg3)

---

## 🔧 Comandos Úteis

```bash
# Ver logs de todos os serviços
docker-compose logs -f

# Ver logs de um serviço específico
docker-compose logs -f backend
docker-compose logs -f whatsapp-bridge
docker-compose logs -f postgres

# Entrar no container do backend
docker exec -it bagcoin-backend sh

# Entrar no banco de dados
docker exec -it bagcoin-postgres psql -U bagcoin -d bagcoin

# Rebuild após mudanças no código
docker-compose up -d --build

# Ver status dos containers
docker-compose ps
```

---

## 🐛 Troubleshooting

### A bridge do WhatsApp não conecta
A bridge usa `whatsapp-web.js` com Puppeteer/Chromium. A primeira execução pode demorar para baixar dependências. Verifique:
```bash
docker logs -f bagcoin-whatsapp-bridge
```
Se aparecer o QR Code no terminal, escaneie com seu WhatsApp.

### Erro de conexão com PostgreSQL
O backend tem um `entrypoint.sh` que espera o PostgreSQL ficar healthy antes de iniciar. Se houver erro:
```bash
docker-compose down -v
docker-compose up -d --build
```

### Portas em uso
O Postgres da **API** está no `docker-compose.yml` da raiz (mapeamento típico `5432:5432`). O Postgres **só para a web** está em [`web/docker-compose.yml`](web/docker-compose.yml) (típico `5433:5432`).

Se as portas 8000, 3001 ou 5432 estiverem ocupadas, edite o compose da raiz:
```yaml
ports:
  - "8080:8000"  # backend
  - "3002:3001"  # whatsapp bridge
  - "5434:5432"  # postgres API (exemplo)
```

Para a web, ajuste `POSTGRES_WEB_PORT` ou o mapeamento em `web/docker-compose.yml`.

---

## 📄 Licença

MIT
