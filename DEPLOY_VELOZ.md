# Deploy na Veloz - Guia Completo

## Visao Geral

Este guia documenta como fazer deploy do projeto Bagcoin na plataforma Veloz (onveloz.com).

### Arquitetura na Veloz

| Servico | Tipo | Descricao |
|---------|------|-----------|
| `server` | WEB | FastAPI + Celery (API principal) |
| `worker` | WORKER | Processamento assincrono Celery |
| `whatsapp` | WEB | Bridge WhatsApp Web.js |
| `web` | WEB | Frontend Next.js |
| `postgres` | DATABASE | PostgreSQL gerenciado |
| `redis` | DATABASE | Redis gerenciado |
| `mongo` | - | MongoDB Atlas (externo) |

> **Nota:** A Veloz nao oferece MongoDB gerenciado. Usaremos MongoDB Atlas (gratuito).

---

## Pre-requisitos

1. Conta na Veloz: https://app.onveloz.com
2. CLI instalada:
   ```bash
   npm i -g onveloz
   ```
3. Login:
   ```bash
   veloz login
   ```
4. Conta no MongoDB Atlas (gratuito): https://www.mongodb.com/atlas

---

## Passo 1: Primeiro Deploy (Gerar veloz.json)

```bash
# Na raiz do projeto
veloz deploy
```

A CLI vai detectar o monorepo e perguntar quais apps deployar. Selecione:
- `apps/server`
- `apps/whatsapp`
- `apps/web`

O arquivo `veloz.json` sera gerado automaticamente na raiz.

> **Nota:** O worker nao sera detectado automaticamente pois usa o mesmo codigo do server. Adicione manualmente ao `veloz.json` apos o primeiro deploy (veja Passo 4).

---

## Passo 2: Configurar Bancos de Dados

### PostgreSQL

```bash
# Criar banco
veloz db create --name postgres --engine postgresql --version 16 --storage 10Gi --pooler

# Ver credenciais
veloz db credentials postgres
```

### Redis

```bash
# Criar banco
veloz db create --name redis --engine redis --version 7

# Ver credenciais
veloz db credentials redis
```

### MongoDB Atlas (Externo)

1. Crie um cluster gratuito no MongoDB Atlas
2. Crie um usuario e senha
3. Obtenha a connection string
4. Libere o IP `0.0.0.0/0` (acesso de qualquer lugar) ou configure IP da Veloz

---

## Passo 3: Configurar Variaveis de Ambiente

### Servico `server`

```bash
veloz env set GROQ_API_KEY=sua_chave_groq --project bagcoin --service server
veloz env set SECRET_KEY=chave_secreta_aleatoria_32_chars --project bagcoin --service server
veloz env set TAVILY_API_KEY=sua_chave_tavily --project bagcoin --service server
```

> **IMPORTANTE:** As variaveis de banco sao injetadas automaticamente pela Veloz:
> - `POSTGRES_DATABASE_URL` - URL direta do PostgreSQL
> - `POSTGRES_POOLER_URL` - URL via PgBouncer (recomendado para queries)
> - `REDIS_URL` - URL do Redis

O server usa estas variaveis, entao precisamos mapear:

```bash
# Mapear para nomes que o app espera
veloz env set DATABASE_URL='${POSTGRES_POOLER_URL}' --project bagcoin --service server
```

### Servico `worker`

```bash
# Mesmas env vars do server
veloz env set GROQ_API_KEY=sua_chave_groq --project bagcoin --service worker
veloz env set SECRET_KEY=chave_secreta_aleatoria_32_chars --project bagcoin --service worker
veloz env set DATABASE_URL='${POSTGRES_POOLER_URL}' --project bagcoin --service worker
veloz env set REDIS_URL='${REDIS_URL}' --project bagcoin --service worker
veloz env set WHATSAPP_BRIDGE_URL='${VELOZ_PUBLIC_URL}' --project bagcoin --service worker
```

> **Nota:** `VELOZ_PUBLIC_URL` e injetada automaticamente. Mas precisamos da URL do servico whatsapp.

### Servico `whatsapp`

```bash
veloz env set API_URL='${VELOZ_PUBLIC_URL}' --project bagcoin --service whatsapp
veloz env set PORT=3002 --project bagcoin --service whatsapp
veloz env set MONGO_URL='sua_connection_string_mongodb_atlas' --project bagcoin --service whatsapp
```

### Servico `web`

```bash
veloz env set NEXT_PUBLIC_API_URL='${VELOZ_PUBLIC_URL}' --project bagcoin --service web
```

---

## Passo 4: Atualizar veloz.json

Apos o primeiro deploy e criacao dos bancos, edite o `veloz.json` gerado. Use o `veloz.json.example` como referencia:

```bash
cp veloz.json.example veloz.json
# Edite veloz.json com os IDs gerados pelo primeiro deploy
```

Configuracao completa com worker:

```json
{
  "$schema": "https://onveloz.com/schemas/veloz-config.schema.json",
  "version": "1.0",
  "project": {
    "id": "proj_abc123",
    "name": "bagcoin"
  },
  "databases": {
    "postgres": {
      "engine": "postgresql",
      "version": "16",
      "storage": "10Gi",
      "size": "essencial",
      "pooler": {
        "enabled": true,
        "poolMode": "transaction",
        "defaultPoolSize": 20,
        "maxClientConn": 100
      }
    },
    "redis": {
      "engine": "redis",
      "version": "7",
      "size": "basico"
    }
  },
  "services": {
    "apps/server": {
      "id": "svc_server_xyz",
      "name": "server",
      "type": "web",
      "branch": "main",
      "build": {
        "method": "dockerfile",
        "dockerfile": "Dockerfile"
      },
      "runtime": {
        "command": ".venv/bin/python -m uvicorn src.main:app --host 0.0.0.0 --port 8000",
        "preStartCommand": ".venv/bin/python -m alembic upgrade head",
        "port": 8000
      },
      "size": "essencial"
    },
    "apps/worker": {
      "id": "svc_worker_xyz",
      "name": "worker",
      "type": "worker",
      "branch": "main",
      "root": "apps/server",
      "build": {
        "method": "dockerfile",
        "dockerfile": "Dockerfile.worker"
      },
      "runtime": {
        "command": ".venv/bin/python -m celery -A src.celery_app worker --loglevel=info --concurrency=2"
      },
      "size": "essencial"
    },
    "apps/whatsapp": {
      "id": "svc_whatsapp_xyz",
      "name": "whatsapp",
      "type": "web",
      "branch": "main",
      "build": {
        "method": "dockerfile",
        "dockerfile": "Dockerfile"
      },
      "runtime": {
        "command": "npm start",
        "port": 3002
      },
      "size": "turbo"
    },
    "apps/web": {
      "id": "svc_web_xyz",
      "name": "web",
      "type": "web",
      "branch": "main",
      "build": {
        "method": "dockerfile",
        "dockerfile": "Dockerfile"
      },
      "runtime": {
        "command": "bun run start",
        "port": 3000
      },
      "size": "essencial"
    }
  }
}
```

> **IMPORTANTE:** Nao edite os campos `id`. Eles sao gerados pela Veloz.
> **IMPORTANTE:** O `veloz.json` real nao deve ser commitado (esta no .gitignore). Use o `veloz.json.example` como template.

---

## Passo 5: Deploy

```bash
veloz deploy
```

---

## Troubleshooting

### Erro: MongoDB nao conecta
- Verifique se liberou o IP `0.0.0.0/0` no MongoDB Atlas
- Verifique a connection string

### Erro: WhatsApp bridge nao inicia
- O WhatsApp Web.js precisa de Chromium. O Dockerfile ja inclui.
- Verifique logs: `veloz logs --project bagcoin --service whatsapp`

### Erro: Worker nao processa filas
- Verifique se REDIS_URL esta configurado
- Verifique logs: `veloz logs --project bagcoin --service worker`

### Erro: Banco nao conecta
- Use `POSTGRES_POOLER_URL` (porta 6432) para queries
- Use `POSTGRES_DATABASE_URL` (porta 5432) para migrations

---

## Comandos Uteis

```bash
# Ver logs
veloz logs --project bagcoin --service server

# Listar servicos
veloz services --project bagcoin

# Restart servico
veloz services restart --project bagcoin --service server

# Escalar servico
veloz services scale --project bagcoin --service server --size turbo

# Ver variaveis
veloz env list --project bagcoin --service server
```

---

## Seguranca

- **Nunca commite** `.env` ou `veloz.json`
- Use `veloz env set` para todas as variaveis secretas
- O arquivo `veloz.json` contem IDs do projeto e esta no `.gitignore`
- Use `veloz.json.example` como template de referencia
- Gere uma `SECRET_KEY` forte: `openssl rand -hex 32`
