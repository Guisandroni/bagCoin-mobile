# WhatsApp Bridge (whatsapp-web.js + Fastify + TypeScript)

Este app atua como um bridge entre o WhatsApp Web e o backend Backcoin, substituindo a integração via Green API.

## Stack

- **Runtime**: Node.js 20
- **Language**: TypeScript
- **Framework**: Fastify
- **WhatsApp**: whatsapp-web.js com `LocalAuth` (sessão persistida em volume Docker)
- **Features**:
  - Reconexão automática com backoff exponencial
  - Graceful shutdown (SIGTERM/SIGINT)
  - Limpeza automática de locks do Chromium
  - Tipagem completa

## Como funciona

1. Inicia o cliente `whatsapp-web.js` com estratégia `LocalAuth`
2. Exibe um QR Code no terminal para autenticação
3. Recebe mensagens do WhatsApp e encaminha para o backend via HTTP (`POST /webhook/whatsapp`)
4. Expõe endpoints para o backend enviar mensagens e arquivos de volta
5. Em caso de desconexão, reconecta automaticamente (até 5 tentativas)

## Setup

```bash
cd apps/whatsapp
npm install
```

## Variáveis de Ambiente

Copie `.env.example` para `.env`:

```bash
cp .env.example .env
```

| Variável | Descrição | Padrão |
|---|---|---|
| `API_URL` | URL do backend Backcoin | `http://localhost:8001` |
| `PORT` | Porta do bridge WhatsApp | `3002` |

## Rodar em desenvolvimento

```bash
npm run dev
```

## Build

```bash
npm run build
```

## Rodar em produção

```bash
npm run build
npm start
```

Na primeira execução (ou se a sessão expirar), um QR Code será exibido no terminal. Escaneie com o WhatsApp do celular.

## Endpoints

- `POST /send-message` - Envia mensagem de texto
  ```json
  {
    "chatId": "5511999999999@c.us",
    "text": "Olá!"
  }
  ```

- `POST /send-file` - Envia arquivo (base64)
  ```json
  {
    "chatId": "5511999999999@c.us",
    "base64File": "...",
    "filename": "relatorio.pdf",
    "caption": "Seu relatório"
  }
  ```

- `GET /health` - Health check

## Estrutura

```
apps/whatsapp/
├── src/
│   ├── index.ts          # Entry point (Fastify server)
│   ├── client.ts         # whatsapp-web.js client logic
│   ├── api.ts            # HTTP routes (Fastify)
│   ├── types.ts          # TypeScript interfaces
│   └── types/global.d.ts # Module declarations
├── dist/                 # Compiled JavaScript
├── tsconfig.json
└── package.json
```

## Sessão e Reconexão

O bridge usa `LocalAuth` para persistir a sessão em `/app/.wwebjs_auth`. Em ambiente Docker, este diretório é um volume persistente (`whatsapp_auth`), garantindo que a sessão sobreviva a reinícios do container.

Se o WhatsApp for desconectado, o bridge tentará reconectar automaticamente até 5 vezes, com delay crescente entre as tentativas.
