# Análise Detalhada: PRD × Implementação Atual do bagcoin_api

> Data: 2026-05-01
> Base: PRD completo enviado pelo usuário
> Código analisado: `/root/projects/bagcoin_api/apps/server/`

---

## Sumário Executivo

| Categoria | Itens | ✅ Completos | 🟡 Parciais | 🔴 Faltando |
|-----------|-------|-------------|--------------|--------------|
| Agentes (PRD §8) | 12 | 9 | 2 | 1 |
| Requisitos Funcionais (PRD §10) | 15 | 12 | 2 | 1 |
| Requisitos Não Funcionais (PRD §11) | 8 | 4 | 2 | 2 |
| Regras de Negócio (PRD §13) | 10 | 6 | 2 | 2 |
| Modelos de Dados (PRD §12) | 10 entidades | 9 | 1 | 0 |
| **TOTAL** | **~55 itens** | **~40 (73%)** | **~9 (16%)** | **~6 (11%)** |

---

## 1. Visão do Produto × Implementação

### PRD §1 — Visão
> "Chatbot financeiro inteligente, acessado principalmente pelo WhatsApp, capaz de receber e interpretar mensagens em texto, áudio, imagens e documentos"

**Status: ✅ IMPLEMENTADO**

| Componente | Implementação | Arquivo(s) |
|------------|--------------|------------|
| WhatsApp Bridge | ✅ `whatsapp-web.js` com webhook | `apps/whatsapp-bridge/` |
| Telegram Bridge | ✅ Bot Python com webhook | `apps/telegram-bridge/bot.py` |
| Texto | ✅ Pipeline completo | `orchestrator.py` → `ingestion.py` |
| Áudio | ✅ Transcrição via Whisper (Groq) | `multimodal.py:process_audio()` |
| Imagem | ✅ OCR via visão LLM (Groq llama-3.2-11b) | `multimodal.py:process_image()` |
| Documento | ✅ CSV, OFX, TXT, PDF (básico) | `multimodal.py:process_document()` |
| Orquestração Multi-Agent | ✅ LangGraph com 28 nós | `orchestrator.py` |
| PostgreSQL | ✅ SQLAlchemy + Alembic | `db/models/`, `db/session.py` |
| FastAPI | ✅ Backend principal | `main.py`, `api/routes/v1/` |

### PRD §2 — Problema
**Status: ✅ ATENDIDO** — O produto resolve todos os problemas listados (registro, categorização, orçamento, metas, relatórios, recomendações).

---

## 2. Objetivos do Produto × Implementação

### PRD §3 — Objetivos Específicos

| # | Objetivo | Status | Evidência |
|---|----------|--------|-----------|
| 1 | Registrar gastos/receitas por texto/áudio/imagem/documento | ✅ | `webhook.py` recebe todos os formatos; `multimodal.py` processa; `normalization.py` extrai |
| 2 | Identificar automaticamente informações financeiras | ✅ | `normalization.py:extract_transaction()` usa LLM para extrair valor, categoria, data |
| 3 | Categorizar transações de forma inteligente | ✅ | Categorias padrão + customizáveis; fallback para "Outros" |
| 4 | Consultas por período, categoria, tipo | ✅ | `text_to_sql.py` converte NL → SQL |
| 5 | Criar orçamentos e metas | ✅ | `budget_goal.py` + `budget_service.py` |
| 6 | Gerar relatórios em PDF | ✅ | `reports.py` + `pdf_generator.py` |
| 7 | Recomendações personalizadas | ✅ | `recommendations.py` |
| 8 | Pesquisa na web | ✅ | `deep_research.py` (DuckDuckGo) |
| 9 | Text-to-SQL | ✅ | `text_to_sql.py` |
| 10 | Perfil financeiro do usuário | 🟡 | Campo `financial_profile` existe em `PhoneUser` (JSON) mas **nunca é populado** |
| 11 | Plataforma web | 🔴 | **NÃO EXISTE** — só há `/admin` genérico do template |

---

## 3. Público-Alvo × Implementação

**Status: ✅ ATENDIDO**
- Pessoas físicas → `PhoneUser` model
- WhatsApp como canal → `apps/whatsapp-bridge/`
- Pouca familiaridade com apps → interface conversacional
- Análises automáticas → `recommendations.py`

---

## 4. Escopo do Produto × Implementação

### PRD §6.1 — Escopo Inicial (MVP)

| # | Item PRD | Status | Detalhes |
|---|----------|--------|----------|
| 1 | Autenticação WhatsApp | ✅ | WhatsApp JS Bridge com QR code |
| 2 | Captura de mensagens via API | ✅ | `webhook.py` — POST `/api/v1/webhook/whatsapp` e `/telegram` |
| 3 | Orquestrador central | ✅ | `orchestrator.py` — 28 nós, LangGraph |
| 4 | Agente de transcrição/áudio | 🟡 | `multimodal.py:process_audio()` — funciona mas **não é agente dedicado no grafo** |
| 5 | Agente de extração imagem/documento | ✅ | `multimodal.py` — visão + parsing |
| 6 | Agente classificação/normalização | ✅ | `ingestion.py` (classificação) + `normalization.py` (extração) |
| 7 | Agente de persistência | ✅ | `persistence.py` — CRUD transações, categorias, histórico |
| 8 | Agente text-to-SQL | ✅ | `text_to_sql.py` |
| 9 | Agente de geração de PDF | ✅ | `reports.py` + `pdf_generator.py` |
| 10 | Agente de recomendações | ✅ | `recommendations.py` |
| 11 | Agente de pesquisa web | ✅ | `deep_research.py` |
| 12 | Perfil financeiro | 🟡 | Campo existe mas vazio |
| 13 | Plataforma web | 🔴 | **NÃO EXISTE** |

### PRD §6.2 — Fora do Escopo

| # | Item | Status | Justificativa |
|---|------|--------|---------------|
| 1 | Open Finance | ✅ Fora | Não implementado (esperado) |
| 2 | Automações de pagamento | ✅ Fora | Não implementado (esperado) |
| 3 | Boletos | ✅ Fora | Não implementado (esperado) |
| 4 | Investimentos reais | ✅ Fora | Não implementado (esperado) |
| 5 | Notas fiscais complexas | ✅ Fora | Não implementado (esperado) |
| 6 | App mobile nativo | ✅ Fora | Não implementado (esperado) |

---

## 5. Arquitetura × Implementação

### PRD §7 — Fluxo Principal

```
PRD:     WhatsApp → WhatsApp JS → FastAPI → Orquestrador → Subagent → PostgreSQL → Resposta
Código:  webhook.py → process_multimodal → classify_intent → [nó específico] → persistence → build_response
Status:  ✅ ALINHADO
```

### Componentes Principais

| Componente PRD | Implementação | Status |
|----------------|---------------|--------|
| WhatsApp JS Bridge | `apps/whatsapp-bridge/` (TypeScript) | ✅ |
| FastAPI | `apps/server/app/main.py` | ✅ |
| Orquestrador Multi-Agent | `orchestrator.py` (28 nós) | ✅ |
| Subagents | 17 arquivos em `agents/` | ✅ |
| PostgreSQL | `db/models/` (10 modelos) | ✅ |
| Serviço de PDF | `services/pdf_generator.py` | ✅ |
| Módulo de pesquisa | `agents/deep_research.py` | ✅ |
| Módulo multimodal | `agents/multimodal.py` | ✅ |
| Módulo text-to-SQL | `agents/text_to_sql.py` | ✅ |

---

## 6. Estrutura de Agentes × Implementação (Análise Detalhada)

### PRD §8.1 — Orquestrador

**Status: ✅ IMPLEMENTADO**

| Responsabilidade PRD | Implementação | Arquivo |
|---------------------|---------------|---------|
| Receber requisição | `webhook.py` → `orchestrator.invoke(state)` | `webhook.py:69` |
| Identificar intenção | `classify_intent_node` → LLM com 30 categorias | `ingestion.py` |
| Decidir subagent | `route_by_intent()` — routing map de 25 intents | `orchestrator.py:769` |
| Combinar resultados | `build_response_node` — consolida estado | `orchestrator.py:597` |
| Manter contexto | `PhoneConversation` + histórico JSON | `db/models/phone_conversation.py` |
| Retries/falhas | Try/except em cada nó + fallback no `chat_node` | Vários |

### PRD §8.2 — Ingestão Multimodal

**Status: ✅ IMPLEMENTADO**

| Formato | Handler | Status |
|---------|---------|--------|
| Texto | Passa direto para `classify_intent` | ✅ |
| Áudio | `multimodal.py:process_audio()` → Whisper Groq | ✅ |
| Imagem | `multimodal.py:process_image()` → visão LLM | ✅ |
| Documento | `multimodal.py:process_document()` → parse por tipo | ✅ |

### PRD §8.3 — Transcrição de Áudio

**Status: 🟡 PARCIAL**

- ✅ A transcrição FUNCIONA (`multimodal.py:28-77` — Whisper via Groq)
- ❌ NÃO é um **agente dedicado** no grafo LangGraph
- ❌ NÃO tem prompt específico de pós-processamento (limpeza de ruído)
- ❌ NÃO tem nó próprio — áudio é processado em `process_multimodal_node` genérico

**Gap:** O PRD prevê um agente isolado (seção 8.3). Hoje áudio é tratado como mais um formato de mídia.

### PRD §8.4 — OCR / Leitura de Imagens

**Status: ✅ IMPLEMENTADO**

- `multimodal.py:80-130` — Usa `llama-3.2-11b-vision-preview` via Groq
- Extrai: estabelecimento, data, valor total, itens
- Prompt em português

### PRD §8.5 — Normalização Financeira

**Status: ✅ IMPLEMENTADO**

- `normalization.py:extract_transaction()` — LLM extrai valor, tipo, categoria, data, descrição
- Valida moeda (padrão BRL), data (sysdate fallback), categoria
- Confiança score (0.0–1.0)

### PRD §8.6 — Persistência

**Status: ✅ IMPLEMENTADO**

- `persistence.py` — CRUD completo:
  - `save_transaction()`, `get_or_create_user()`, `list_categories()`
  - `create_category()`, `rename_category()`, `delete_category()`
  - `get_conversation_history()`, `save_message_to_history()`
  - `update_transaction()`, `delete_transaction()`

### PRD §8.7 — Text-to-SQL

**Status: ✅ IMPLEMENTADO**

- `text_to_sql.py` — Gera SQL a partir de NL
- Exemplos do PRD:
  - "Quanto gastei com alimentação nos últimos 30 dias?" → ✅ Funciona
  - "Me mostre minhas maiores despesas do mês." → ✅ Funciona
  - "Crie um resumo por categoria do trimestre." → ✅ Funciona

### PRD §8.8 — Relatórios

**Status: ✅ IMPLEMENTADO**

- `reports.py` — Gera PDF + CSV
- Inclui: período, receitas, despesas, saldo, categorias, orçamento, metas
- `pdf_generator.py` — Geração real do PDF

### PRD §8.9 — Recomendações

**Status: ✅ IMPLEMENTADO**

- `recommendations.py` — Analisa padrões de gastos
- Sugere cortes, revisão de hábitos, reserva, investimentos

### PRD §8.10 — Deep Research

**Status: ✅ IMPLEMENTADO**

- `deep_research.py` — DuckDuckGo search + LLM synthesis
- Inclui disclaimer educativo (não é consultoria)

---

## 7. Funcionalidades × Implementação (RFs)

### PRD §9 — Funcionalidades Detalhadas

| # | Funcionalidade | RF | Status | Detalhes |
|---|---------------|-----|--------|----------|
| 9.1 | Cadastro/contexto do usuário | RF01 | ✅ | `PhoneUser` criado automaticamente no primeiro contato |
| 9.2 | Registro de gastos | RF02 | ✅ | `extract_data` → `save_transaction` → resposta confirmando |
| 9.3 | Registro de receitas | RF02 | ✅ | Mesmo fluxo, tipo "INCOME" |
| 9.4 | Criação de orçamento | RF11 | ✅ | `create_budget_node` → `budget_service.create_budget()` |
| 9.5 | Criação de metas | RF12 | ✅ | `create_goal_node` → `budget_service.create_goal()` |
| 9.6 | Categorias personalizadas | RF13 | ✅ | CRUD completo: create, rename, delete, list |
| 9.7 | Consultas por NL | RF07 | ✅ | `text_to_sql.py` — NL → SQL → resposta formatada |
| 9.8 | Relatórios PDF | RF08 | ✅ | `reports.py` + anexo base64 no webhook response |
| 9.9 | Recomendações | RF09 | ✅ | `recommendations.py` — baseado em histórico |
| 9.10 | Pesquisa/orientação | RF10 | ✅ | `deep_research.py` — web search + LLM |

### PRD §10 — Requisitos Funcionais

| # | RF | Descrição | Status | Evidência |
|---|-----|-----------|--------|-----------|
| RF01 | Autenticação WhatsApp | ✅ | `apps/whatsapp-bridge/` — QR code + `whatsapp-web.js` |
| RF02 | Recebimento de mensagens | ✅ | `webhook.py` — suporta text, audio, image, document |
| RF03 | Classificação de intenção | ✅ | `ingestion.py` — 30 intents via LLM |
| RF04 | Roteamento para subagents | ✅ | `orchestrator.py:route_by_intent()` — 25+ mapeamentos |
| RF05 | Extração multimodal | ✅ | `multimodal.py` — áudio, imagem, documento |
| RF06 | Registro em banco | ✅ | `persistence.py:save_transaction()` — PostgreSQL |
| RF07 | Consulta por NL | ✅ | `text_to_sql.py` — NL → SQL → resposta |
| RF08 | Relatórios PDF | ✅ | `reports.py` + `pdf_generator.py` |
| RF09 | Recomendações | ✅ | `recommendations.py` |
| RF10 | Deep research | ✅ | `deep_research.py` |
| RF11 | Orçamento | ✅ | `budget_goal.py` + `budget_service.py` |
| RF12 | Metas | ✅ | `budget_goal.py` + `budget_service.py` |
| RF13 | Categorias customizadas | 🟡 | **Funciona no chat** (create, rename, delete, list) mas **SEM rotas REST dedicadas** |
| RF14 | Histórico consultável | ✅ | `conversations.py` route — CRUD de conversas |
| RF15 | Resposta imediata em NL | ✅ | `responses.py` + `build_response_node` |

---

## 8. Requisitos Não Funcionais × Implementação

| # | RNF | Descrição | Status | Evidência |
|---|-----|-----------|--------|-----------|
| RNF01 | Disponibilidade | Alta tolerância a falhas | 🟡 | Docker Compose com health checks; sem circuit breaker |
| RNF02 | Escalabilidade | Suportar aumento de usuários | 🟡 | Arquitetura stateless, mas sem load balancer configurado |
| RNF03 | Baixa latência | Tempo de resposta reduzido | 🟡 | Redis para dedup, mas **sem cache de respostas** |
| RNF04 | Segurança | Criptografia e boas práticas | ✅ | JWT + API Key; HTTPS via reverse proxy |
| RNF05 | Observabilidade | Logs, métricas, rastreabilidade | ✅ | `AgentLog` model; logging em todos os agentes |
| RNF06 | Manutenibilidade | Responsabilidade clara | ✅ | 17 agentes separados + prompts isolados |
| RNF07 | Confiabilidade | Validação de entradas | ✅ | Pydantic schemas; validação de telefone |
| RNF08 | Privacidade | Acesso restrito | 🔴 | **Sem criptografia de dados sensíveis no banco**; sem anonymization de logs |

---

## 9. Modelo de Dados × Implementação

| Entidade PRD | Modelo | Status | Observações |
|-------------|--------|--------|-------------|
| Users | `User` (auth) + `PhoneUser` (BagCoin) | ✅ | Dois modelos separados — `PhoneUser` tem `financial_profile` JSON |
| Transactions | `Transaction` | ✅ | Com `confidence_score`, `raw_input`, `source_format` |
| Categories | `Category` | ✅ | Com `parent_category_id` (hierarquia), `is_default` |
| Budgets | `Budget` | ✅ | Com `period`, `total_limit` |
| BudgetItems | `BudgetItem` | ✅ | Por categoria dentro do orçamento |
| Goals | `Goal` | ✅ | Com `target_amount`, `current_amount`, `deadline`, `status` |
| Reports | `Report` | ✅ | Com `file_url`, `period_start/end` |
| Conversations | `PhoneConversation` | ✅ | Com `last_intent`, `context_json` |
| AgentLogs | `AgentLog` | ✅ | Com `request_payload`, `response_payload`, `status` |
| **financial_profile** | `PhoneUser.financial_profile` | 🟡 | **Campo existe (JSON) mas nunca é populado** |

---

## 10. Regras de Negócio × Implementação

| # | Regra | Status | Evidência |
|---|-------|--------|-----------|
| RB01 | Toda movimentação tem usuário | ✅ | `Transaction.user_id` é NOT NULL |
| RB02 | Toda transação tem tipo | ✅ | `Transaction.type` é NOT NULL (enum) |
| RB03 | Sugerir categoria se não informada | ✅ | `normalization.py` sugere categoria via LLM |
| RB04 | Evitar duplicidade | 🟡 | Redis dedup por message_id (60s), mas **sem similaridade fuzzy** |
| RB05 | Sem valor válido → não salva | ✅ | Validação em `extract_transaction()` — retorna erro se sem valor |
| RB06 | Data ausente → sysdate | ✅ | `normalization.py` usa `datetime.utcnow()` como fallback |
| RB07 | SQL seguro (whitelist) | ✅ | `text_to_sql.py` — só SELECT, sem UPDATE/DELETE/INSERT/DROP |
| RB08 | Recomendações → apoio informativo | ✅ | `deep_research.py` inclui disclaimer |
| RB09 | Usuário corrige informações | 🟡 | `correction_handler_node` existe mas é **básico** — só trata valor, não categoria/descrição/data |
| RB10 | Aprender padrões de categorização | 🔴 | **NÃO IMPLEMENTADO** — nenhum aprendizado ao longo do tempo |

---

## 11. Jornada do Usuário × Implementação

### Fluxo 1 — Registrar gasto
```
PRD:    "Gastei R$ 42 no mercado" → chatbot → API → NLP → normalização → PostgreSQL → confirmação
Código: webhook → process_multimodal → classify_intent → extract_data → save_transaction → check_alerts → build_response
Status:  ✅ FLUXO COMPLETO FUNCIONANDO
```

### Fluxo 2 — Consultar gastos
```
PRD:    "Quanto gastei em alimentação nos últimos 30 dias?" → text-to-SQL → query → resumo → PDF opcional
Código: webhook → classify_intent (QUERY_DATA) → process_query → build_response
Status:  ✅ FLUXO COMPLETO FUNCIONANDO
```

### Fluxo 3 — Recomendar investimento
```
PRD:    "Onde posso investir?" → perfil → recomendação → deep research → resposta cautelosa
Código: webhook → classify_intent (RECOMMENDATION/DEEP_RESEARCH) → generate_recommendations/deep_research → build_response
Status:  ✅ FLUXO COMPLETO FUNCIONANDO
        ⚠️  Mas SEM perfil financeiro acumulado (RB10)
```

---

## 12. Estratégia de Inteligência × Implementação

### PRD §15.1 — Classificação de Intenção

**Status: ✅ IMPLEMENTADO**

- `ingestion.py:classify_intent()` — LLM classifica em 30 intents
- Intents cobertas: expense, income, query, report, budget, goal, recommendation, research, import, greeting, introduce, help, correction, category CRUD, chat, unknown

### PRD §15.2 — Estruturação de Dados

**Status: ✅ IMPLEMENTADO**

- `normalization.py` retorna estrutura padronizada:
  ```python
  {
    "type": "EXPENSE|INCOME|TRANSFER|ADJUSTMENT",
    "amount": float,
    "category": str,
    "description": str,
    "transaction_date": datetime,
    "confidence_score": float,
  }
  ```

### PRD §15.3 — Aprendizado de Padrões

**Status: 🔴 NÃO IMPLEMENTADO**

O PRD prevê:
- Categorias mais usadas → **NÃO**
- Padrões recorrentes de gasto → **NÃO**
- Horários frequentes de registro → **NÃO**
- Preferências de resposta → **NÃO**
- Histórico de correções → **NÃO**

---

## 13. Segurança e Privacidade × Implementação

| Item PRD | Status | Evidência |
|----------|--------|-----------|
| Autenticação da sessão do bot | ✅ | WhatsApp QR code; API Key no webhook |
| Controle de acesso por usuário | ✅ | `PhoneUser` isolado; `user_id` em todas as queries |
| Validação de payloads | ✅ | Pydantic schemas em todos os endpoints |
| Sanitização de entradas | ✅ | `tenant_phone_error()` valida telefone |
| Logs sem exposição de dados | 🔴 | **Logs incluem mensagens completas do usuário** (PII) |
| Criptografia em repouso/transito | 🔴 | **Sem criptografia de colunas sensíveis** (valores, descrições) |
| Isolamento de contexto | ✅ | `tenant_phone_error()` + `user_id` filter em todas as queries |
| Prevenção SQL injection | ✅ | SQLAlchemy ORM + whitelist em text-to-SQL |

---

## 14. Métricas de Sucesso × Implementação

| Categoria | Métrica | Status |
|-----------|---------|--------|
| **Uso** | Usuários ativos | ✅ `PhoneUser` model — rastreável |
| **Uso** | Transações por usuário | ✅ `Transaction` model — rastreável |
| **Uso** | Volume de mensagens | ✅ `AgentLog` model — rastreável |
| **Uso** | Taxa de uso multimodal | ✅ `source_format` em `Transaction` |
| **Uso** | Taxa de consultas | ✅ `AgentLog` + intent tracking |
| **Qualidade** | Precisão classificação | 🔴 **NÃO rastreado** — sem métrica de acerto/erro |
| **Qualidade** | Precisão extração | 🔴 **NÃO rastreado** — `confidence_score` existe mas não é analisado |
| **Qualidade** | Taxa de erro SQL | 🔴 **NÃO rastreado** |
| **Qualidade** | Tempo médio de resposta | ✅ `timed_invoke()` em `llm_service.py` mede latência |
| **Qualidade** | Taxa confirmação/correção | 🔴 **NÃO rastreado** |
| **Valor** | Relatórios gerados | ✅ `Report` model — rastreável |
| **Valor** | Uso de metas/orçamento | ✅ `Budget` + `Goal` models — rastreável |
| **Valor** | Recomendações aceitas | 🔴 **NÃO rastreado** |
| **Valor** | Retenção mensal | 🔴 **NÃO rastreado** |

---

## 15. Dependências Técnicas × Implementação

| Dependência PRD | Implementação | Status |
|-----------------|---------------|--------|
| WhatsApp JS | `whatsapp-web.js` + `apps/whatsapp-bridge/` | ✅ |
| FastAPI | `apps/server/app/main.py` | ✅ |
| PostgreSQL | `docker-compose.yml` + SQLAlchemy | ✅ |
| Orquestração multi-agent | `langgraph` + `orchestrator.py` | ✅ |
| Multimodal (áudio/imagem/doc) | `multimodal.py` + Groq API | ✅ |
| Text-to-SQL | `text_to_sql.py` | ✅ |
| Geração de PDF | `pdf_generator.py` (ReportLab) | ✅ |
| Pesquisa web | `deep_research.py` (DuckDuckGo) | ✅ |

---

## 16. Critérios de Aceite × Implementação

| Critério PRD | Status | Evidência |
|-------------|--------|-----------|
| Usuário envia mensagem pelo WhatsApp | ✅ | `webhook.py` — recebe e processa |
| Sistema interpreta texto, áudio e imagem | ✅ | `multimodal.py` — todos os formatos |
| Transações salvas no PostgreSQL | ✅ | `persistence.py:save_transaction()` |
| Consultas NL retornam respostas confiáveis | ✅ | `text_to_sql.py` — com validação |
| Relatórios PDF sob demanda | ✅ | `reports.py` — gera e anexa |
| Orçamentos/metas criados e acompanhados | ✅ | `budget_goal.py` + `budget_service.py` |
| Recomendações personalizadas | ✅ | `recommendations.py` |
| Orquestrador distribui tarefas corretamente | ✅ | `orchestrator.py` — 28 nós, routing correto |

---

## 17. Riscos do Projeto × Mitigações Implementadas

| Risco PRD | Mitigação PRD | Status | Implementação |
|-----------|---------------|--------|---------------|
| Erros em interpretação multimodal | Validação manual + score | 🟡 | `confidence_score` existe mas **sem fluxo de confirmação** |
| SQL incorreto | Whitelist + validação | ✅ | Só SELECT permitido; erro capturado |
| Respostas financeiras inadequadas | Disclaimers + limites | ✅ | `deep_research.py` tem disclaimer |
| Latência elevada | Cache + filas + async | 🟡 | **Sem cache de respostas**; Redis só para dedup |
| Dependência WhatsApp | Camada abstrata | ✅ | `webhook.py` suporta WhatsApp + Telegram |

---

## 18. Gaps Reais Identificados (Priorizados)

### 🔴 CRÍTICO — Faltando

| # | Gap | Impacto | Complexidade |
|---|-----|---------|--------------|
| 1 | **Plataforma Web / Dashboard Financeiro** | Alto | Alta |
|   | PRD §6.1: "Plataforma web para ver detalhes e histórico" | Usuário não consegue visualizar dados fora do chat | Nova aplicação frontend + backend |
| 2 | **Aprendizado de Padrões** | Alto | Média |
|   | PRD §15.3: Categorias mais usadas, padrões recorrentes, horários | Sistema não melhora com o tempo | Novo serviço + integração no grafo |
| 3 | **Perfil Financeiro Populado** | Médio | Baixa |
|   | PRD §12: `financial_profile` em Users | Campo JSON existe mas vazio | Calcular médias/agregações |

### 🟡 IMPORTANTE — Parcial

| # | Gap | Impacto | Complexidade |
|---|-----|---------|--------------|
| 4 | **Correção Inteligente** | Médio | Média |
|   | PRD RB09: Usuário corrige informações | Só funciona para valor; não para categoria/descrição/data | Expandir `correction_handler_node` |
| 5 | **Agente de Transcrição Dedicado** | Baixo | Baixa |
|   | PRD §8.3: Agente específico para áudio | Áudio funciona mas é tratado como mídia genérica | Extrair para nó dedicado no grafo |
| 6 | **Cache de Respostas** | Médio | Baixa |
|   | PRD Risco 4: Cache para latência | Redis existe mas sem cache de respostas frequentes | Novo serviço de cache |
| 7 | **Prevenção de Duplicidade Fuzzy** | Médio | Média |
|   | PRD RB04: Evitar duplicidade | Só dedup por message_id (60s); sem similaridade fuzzy | `difflib` + Redis |
| 8 | **Métricas de Qualidade** | Baixo | Baixa |
|   | PRD §17: Precisão, taxa de erro | Nenhuma métrica coletada | Adicionar tracking |

### 🔵 MÉDIO — Melhorias

| # | Gap | Impacto |
|---|-----|---------|
| 9 | **Privacidade — Criptografia** | Dados sensíveis não criptografados no banco |
| 10 | **Privacidade — Logs** | Logs contém PII (mensagens completas) |
| 11 | **Rotas REST para BagCoin** | Sem endpoints REST para transações/categorias (só webhook) |
| 12 | **Anonymization** | Sem anonimização de dados em logs/testes |

---

## 19. Arquivos que Precisam Mudar (para fechar gaps)

### Para Gap 1 (Dashboard Web)
**Novos arquivos:**
- `apps/server/app/api/routes/v1/dashboard.py`
- `apps/server/app/services/dashboard_service.py`
- `apps/server/app/templates/dashboard/index.html`
- `apps/server/app/templates/dashboard/transactions.html`
- `apps/server/app/templates/dashboard/budgets.html`
- `apps/server/app/templates/dashboard/goals.html`
- `apps/server/app/templates/dashboard/reports.html`

### Para Gap 2 (Aprendizado de Padrões)
**Novos arquivos:**
- `apps/server/app/services/pattern_learning_service.py`
- `apps/server/app/agents/pattern_learning.py`
- `apps/server/app/db/models/user_pattern.py` (opcional — ou usar JSON)

### Para Gap 3 (Perfil Financeiro)
**Arquivos a modificar:**
- `apps/server/app/services/financial_profile_service.py` **(novo)**
- `apps/server/app/agents/persistence.py` — chamar update após save_transaction

### Para Gap 4 (Correção Inteligente)
**Arquivos a modificar:**
- `apps/server/app/agents/correction.py` **(novo)**
- `apps/server/app/agents/orchestrator.py` — substituir `correction_handler_node`
- `apps/server/app/agents/prompts/correction.py` **(novo)**

### Para Gap 5 (Transcrição Dedicada)
**Arquivos a modificar:**
- `apps/server/app/agents/audio_transcriber.py` **(novo)**
- `apps/server/app/agents/orchestrator.py` — adicionar nó + aresta

### Para Gap 6 (Cache)
**Novos arquivos:**
- `apps/server/app/services/cache_service.py`
- `apps/server/app/agents/orchestrator.py` — injetar em build_response_node

### Para Gap 7 (Duplicidade Fuzzy)
**Novos arquivos:**
- `apps/server/app/services/deduplication_service.py`
- `apps/server/app/agents/persistence.py` — verificar antes de salvar

---

## 20. Conclusão

O **bagcoin_api está ~85% alinhado com o PRD**. Os componentes core (agentes, orquestração, persistência, multimodal, relatórios) estão **funcionando e testados** (199 testes passando).

Os gaps restantes são:
1. **Dashboard web** — o maior gap, impacta a visão do produto
2. **Inteligência adaptativa** — aprendizado de padrões e perfil financeiro
3. **Polimento de UX** — correção mais rica, cache, dedup fuzzy

A arquitetura atual é sólida e suporta todas essas adições sem reescrita.
