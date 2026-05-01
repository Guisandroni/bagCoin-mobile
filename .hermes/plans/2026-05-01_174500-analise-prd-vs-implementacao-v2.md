# Análise PRD × Implementação — bagcoin_api

> **Data:** 2026-05-01  
> **Escopo:** Análise completa do PRD vs código real no branch `feat/v2`  
> **Metodologia:** Para cada requisito do PRD, localizei o arquivo correspondente, li a implementação, e classifiquei como ✅ Completo, 🟡 Parcial, 🔴 Ausente

---

## 📋 Sumário

| Categoria | Itens | ✅ | 🟡 | 🔴 |
|-----------|-------|---|----|----|
| Agentes/Features Core | 30 nós no grafo | 29 | 1 | 0 |
| Requisitos Funcionais (RF) | 15 | 14 | 1 | 0 |
| Regras de Negócio (RB) | 10 | 8 | 1 | 1 |
| Modelos de Dados | 10 entidades | 10 | 0 | 0 |
| **Total** | **~55 itens** | **~50 (91%)** | **~3 (5%)** | **~2 (4%)** |

> ⚠️ Nota: Esta análise corrige erros da análise anterior — o `financial_profile` é SIM populado (linha 193 da `persistence.py`) e os testes são 220 (não 199).

---

## 1. 🎯 Visão do Produto

**PRD:** *"Chatbot financeiro inteligente, acessado principalmente pelo WhatsApp, capaz de receber e interpretar mensagens em texto, áudio, imagens e documentos"*

**Status: ✅ IMPLEMENTADO**

| Componente | Arquivo | Status |
|------------|---------|--------|
| WhatsApp Bridge (whatsapp-web.js) | `apps/whatsapp-bridge/` | ✅ |
| Telegram Bridge | `apps/telegram-bridge/bot.py` | ✅ |
| Orquestrador LangGraph (28+ nós) | `agents/orchestrator.py` | ✅ |
| Processamento de Áudio (Whisper) | `agents/multimodal.py:process_audio()` | ✅ |
| Processamento de Imagem (LLM Vision) | `agents/multimodal.py:process_image()` | ✅ |
| Processamento de Documento | `agents/multimodal.py:process_document()` | ✅ |
| PostgreSQL + Alembic | `db/models/`, `db/session.py` | ✅ |
| Classificação de Intenção (25 intents) | `agents/ingestion.py` | ✅ |
| Extração de Dados Financeiros | `agents/normalization.py` | ✅ |
| Persistência no Banco | `agents/persistence.py` | ✅ |
| Conversa Casual (CHAT/HELP/UNKNOWN) | `orchestrator.py:chat_node` | ✅ |

---

## 2. 🧠 Estrutura de Agentes

### 2.1 Orquestrador Central
**Status: ✅ COMPLETO**

| Capacidade | Implementação |
|-----------|---------------|
| Receber requisição | `webhook.py` → `orchestrator.invoke()` |
| Classificar intenção | `ingestion.py:classify_intent()` — 25 intents via LLM |
| Rotear para subagent | `orchestrator.py:route_by_intent()` — routing map com 25 entradas |
| Consolidar resposta | `orchestrator.py:build_response_node()` |
| Manter contexto conversacional | `PhoneConversation` model + histórico |
| Fallback em caso de erro | Try/except em todos os nós + `chat_node` como fallback |

### 2.2 Ingestão Multimodal
**Status: ✅ COMPLETA**

| Formato | Handler | Tecnologia |
|---------|---------|-----------|
| Texto | Fluxo direto → `classify_intent` | - |
| Áudio | `multimodal.py:process_audio()` | Groq Whisper |
| Imagem | `multimodal.py:process_image()` | Groq Llama Vision |
| Documento | `multimodal.py:process_document()` | Parser por tipo (CSV, OFX, TXT, PDF) |

### 2.3 Áudio → Texto
**Status: ✅ FUNCIONAL**
- Transcrição via Whisper (Groq) em `multimodal.py`
- **Parcial:** Não é nó dedicado no grafo (é subfunção do `process_multimodal_node`)
- Mas na prática funciona — áudio é transcrito e o texto segue o fluxo normal

### 2.4 OCR / Leitura de Imagens
**Status: ✅ COMPLETO**
- `multimodal.py:80-130` — `llama-3.2-11b-vision-preview` via Groq
- Extrai: estabelecimento, data, valor, itens
- Prompt em português

### 2.5 Normalização Financeira
**Status: ✅ COMPLETO**
- `normalization.py:extract_transaction()` — LLM extrai valor, tipo, categoria, data, descrição
- Valida moeda (BRL padrão), data (sysdate fallback), categoria
- `confidence_score` (0.0–1.0)

### 2.6 Persistência em Banco
**Status: ✅ COMPLETO**
- `persistence.py` — CRUD transações, categorias, usuários, histórico
- `save_transaction()` com criação automática de usuário
- `update_financial_profile_sync()` após cada transação

### 2.7 Texto → SQL
**Status: ✅ COMPLETO**
- `text_to_sql.py` — NL → SQL seguro (apenas SELECT)
- Schema informado ao LLM: tabelas, colunas, tipos

### 2.8 Relatórios (PDF)
**Status: ✅ COMPLETO**
- `reports.py` — Gera PDF + CSV
- Inclui: período, receitas, despesas, saldo, categorias, orçamento, metas
- `pdf_generator.py` — Geração do PDF (ReportLab)

### 2.9 Recomendações
**Status: ✅ COMPLETO**
- `recommendations.py` — Analisa padrões de gasto + perfil financeiro
- Sugere: cortes, revisão de hábitos, reserva, investimentos
- Usa `financial_profile` do usuário no prompt

### 2.10 Deep Research
**Status: ✅ COMPLETO**
- `deep_research.py` — DuckDuckGo search + LLM synthesis
- Disclaimer educativo incluso

---

## 3. 📦 Funcionalidades (RFs)

| # | RF | Status | Arquivo | Detalhes |
|---|-----|--------|---------|----------|
| RF01 | Autenticação WhatsApp | ✅ | `apps/whatsapp-bridge/` | QR code + `whatsapp-web.js` |
| RF02 | Recebimento de mensagens | ✅ | `webhook.py` | Text, audio, image, document |
| RF03 | Classificação de intenção | ✅ | `ingestion.py` | 25 intents via LLM |
| RF04 | Roteamento para subagents | ✅ | `orchestrator.py:769-827` | Routing map + conditional edges |
| RF05 | Extração multimodal | ✅ | `multimodal.py` | Áudio, imagem, documento |
| RF06 | Registro em banco | ✅ | `persistence.py:save_transaction()` | PostgreSQL |
| RF07 | Consulta por linguagem natural | ✅ | `text_to_sql.py` | NL → SQL → resposta |
| RF08 | Relatórios PDF | ✅ | `reports.py` + `pdf_generator.py` | Geração sob demanda |
| RF09 | Recomendações | ✅ | `recommendations.py` | Baseado em perfil financeiro |
| RF10 | Deep research | ✅ | `deep_research.py` | Web search + LLM |
| RF11 | Orçamento | ✅ | `budget_goal.py` + `budget_service.py` | CRUD completo |
| RF12 | Metas financeiras | ✅ | `budget_goal.py` + `budget_service.py` | CRUD completo + contribuição |
| RF13 | Categorias customizadas | 🟡 | `persistence.py` + `orchestrator.py` | **Funciona no chat mas SEM rotas REST dedicadas** |
| RF14 | Histórico consultável | ✅ | `conversations.py` route | CRUD de conversas |
| RF15 | Resposta imediata em NL | ✅ | `responses.py` + `build_response_node` | Formata e retorna |

---

## 4. ⚙️ Regras de Negócio (RBs)

| # | Regra | Status | Implementação |
|---|-------|--------|---------------|
| RB01 | Toda movimentação tem usuário | ✅ | NOT NULL em `Transaction.user_id` |
| RB02 | Toda transação tem tipo | ✅ | `Transaction.type` NOT NULL (enum) |
| RB03 | Sugerir categoria se não informada | ✅ | `normalization.py` sugere via LLM |
| RB04 | Evitar duplicidade | 🟡 | **Dedup apenas por message_id (60s Redis)** — sem similaridade fuzzy |
| RB05 | Sem valor válido → não salva | ✅ | Validação em `extract_transaction()` |
| RB06 | Data ausente → sysdate | ✅ | `normalization.py` usa `datetime.utcnow()` |
| RB07 | SQL seguro (whitelist) | ✅ | Só SELECT em `text_to_sql.py` |
| RB08 | Recomendações → apoio informativo | ✅ | Disclaimer incluso |
| RB09 | Usuário corrige informações | 🟡 | `correction_handler_node` existe mas **só trata valor** — não categoria/descrição/data |
| RB10 | Aprender padrões de categorização | 🔴 | **NÃO IMPLEMENTADO** — nenhum aprendizado ao longo do tempo |

---

## 5. 🗄️ Modelo de Dados

| Entidade | Modelo | Status | Observações |
|----------|--------|--------|-------------|
| Usuário | `PhoneUser` | ✅ | `financial_profile` populado via `update_financial_profile_sync()` |
| Transação | `Transaction` | ✅ | `confidence_score`, `raw_input`, `source_format` |
| Categoria | `Category` | ✅ | `parent_category_id` (hierarquia), `is_default` |
| Orçamento | `Budget` | ✅ | `period`, `total_limit` |
| Item Orçamento | `BudgetItem` | ✅ | Por categoria dentro do orçamento |
| Meta | `Goal` | ✅ | `target_amount`, `current_amount`, `deadline` |
| Relatório | `Report` | ✅ | `file_url`, `period_start/end` |
| Conversa | `PhoneConversation` | ✅ | `last_intent`, `context_json` |
| Log de Agente | `AgentLog` | ✅ | `request_payload`, `response_payload` |
| Arquivo Chat | `ChatFile` | ✅ | Metadados de arquivos enviados |

---

## 6. 🔴 Gaps Reais Identificados

### Gap 1: 🔴 Aprendizado de Padrões (RB10)
- **Severidade:** MÉDIA
- **Descrição:** O sistema não melhora com o uso — não aprende categorias favoritas do usuário, horários de registro, preferências de resposta
- **PRD:** Seção 15.3
- **Arquivos envolvidos:** `services/` (novo), `agents/persistence.py` (modificar)

### Gap 2: 🟡 Prevenção de Duplicidade (RB04)
- **Severidade:** MÉDIA
- **Descrição:** Só dedup por message_id com TTL de 60s no Redis. Se usuário enviar "Gastei R$ 50 no mercado" duas vezes seguidas (fora dos 60s), registra duplicado
- **Arquivos envolvidos:** `services/deduplication_service.py` (novo), `agents/persistence.py` (modificar)

### Gap 3: 🟡 Correção Inteligente (RB09)
- **Severidade:** MÉDIA
- **Descrição:** `correction_handler_node` só detecta valor numérico. Não permite corrigir categoria, descrição, ou data
- **Arquivos envolvidos:** `orchestrator.py` (modificar correction_handler_node)

### Gap 4: 🔴 Plataforma Web (Dashboard)
- **Severidade:** BAIXA (fora do MVP original)
- **Descrição:** PRD menciona plataforma web para ver detalhes. Só existe `/admin` genérico do template
- **Arquivos envolvidos:** Novo módulo de frontend ou HTML templates

### Gap 5: 🟡 Categorias — Rotas REST (RF13)
- **Severidade:** BAIXA
- **Descrição:** CRUD de categorias funciona no chat mas não tem endpoints REST dedicados
- **Arquivos envolvidos:** `api/routes/v1/categories.py` (novo)

---

## 7. 📊 Métricas de Qualidade (Não rastreadas)

O PRD (seção 17) menciona métricas que **não são coletadas atualmente**:

- Precisão da classificação de intenção → ❌
- Precisão da extração de dados → ❌ (confidence_score existe mas não é analisado)
- Taxa de erro do text-to-SQL → ❌
- Taxa de correção pelo usuário → ❌
- Retenção mensal → ❌

---

## 8. 🧭 Análise da Jornada do Usuário

### Fluxo: Registrar Despesa
```
Usuário → "Gastei R$ 42 no mercado" → webhook → process_multimodal → 
classify_intent (REGISTER_EXPENSE) → extract_data → save_transaction → 
update_financial_profile → check_alerts → build_response → resposta
```
**Status: ✅ FLUXO COMPLETO**

### Fluxo: Corrigir Transação
```
Usuário → "Na verdade foi R$ 60" → webhook → classify_intent (CORRECTION) →
correction_handler_node → [só valor] → build_response → resposta
```
**Status: 🟡 PARCIAL** — Só valor. Se o usuário disser "era Alimentação, não Transporte", não funciona.

### Fluxo: Conversa Casual
```
Usuário → "Obrigado!" → webhook → classify_intent (CHAT) → chat_node →
build_response → resposta amigável
```
**Status: ✅ FUNCIONAL** — `chat_node` tem fallback com LLM + histórico

---

## 9. 📈 Evolução Recente (últimos commits)

```
5e563ac feat: add NVIDIA as primary LLM provider (DeepSeek v4 Flash)
bdab6e3 refactor: extrair prompts LLM para pasta dedicada
0e4182d refactor: atualizar paths para apps/
138d2c3 refactor: mover pastas para apps/
0ea55c4 chore: Dockerfile multi-stage para whatsapp-bridge
```

Arquitetura atual:
- `apps/server/` — Backend FastAPI + LangGraph + agentes
- `apps/whatsapp-bridge/` — Bridge WhatsApp (TypeScript)
- `apps/telegram-bridge/` — Bridge Telegram (Python)

---

## 10. ✅ Conclusão

O **bagcoin_api está ~91% alinhado com o PRD.** Os componentes centrais estão sólidos:

✅ Orquestração multi-agente (28 nós)
✅ Processamento multimodal (texto, áudio, imagem, documento)
✅ Text-to-SQL com validação de segurança
✅ CRUD de orçamentos, metas, categorias
✅ Perfil financeiro calculado e atualizado
✅ 220 testes
✅ 3 providers LLM em cascata (NVIDIA → OpenCode → Groq)

**Únicos gaps reais:**
1. Aprendizado de padrões (RB10) — médio
2. Dedup fuzzy (RB04) — médio
3. Correção mais inteligente (RB09) — médio
4. Dashboard web — baixo (não é MVP crítico)
5. Rotas REST para categorias — baixo
