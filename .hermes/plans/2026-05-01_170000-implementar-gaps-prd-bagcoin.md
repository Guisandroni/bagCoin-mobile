# Plano: Implementar Gaps do PRD no bagcoin_api

## 1. Goal

Implementar os gaps identificados entre o PRD (Product Requirements Document) e a implementação atual do bagcoin_api, priorizando as funcionalidades com maior impacto na experiência do usuário.

## 2. Contexto Atual

O projeto já está **~90% alinhado com o PRD**. Após inspeção detalhada do código, descobri que vários itens que pareciam faltar **já existem**:

| Item | Status real |
|------|-------------|
| `IntentType.CORRECTION` | ✅ Já existe no enum |
| `correction_handler_node` | ✅ Já existe no orchestrator |
| `IntentType.CHAT` | ✅ Já existe, com node completo |
| `chat_node` | ✅ Com LLM + fallbacks + histórico |
| `PhoneUser.financial_profile` | ✅ Campo JSON já existe no modelo |
| CRUD de Categorias | ✅ Create, rename, delete, list já funcionam |
| Deduplicação (Redis) | ✅ Em `webhook.py` |

### Gaps reais (do PRD que ainda não existem)

1. **🔴 Agente de Transcrição de Áudio dedicado** (PRD §8.3) — `multimodal.py` trata áudio mas sem agente isolado no grafo
2. **🔴 Dashboard Web Financeiro** (PRD §6.1) — Não existe frontend financeiro
3. **🟡 Perfil Financeiro** (PRD §12, §15.3) — Campo `financial_profile` existe mas nunca é populado
4. **🟡 Aprendizado de Padrões** (PRD §15.3) — Nada implementado
5. **🟡 Correção Inteligente pelo Usuário** (PRD RB09) — Existe implementação básica, mas precisa de fluxo mais rico
6. **🔵 Prevenção de Duplicidade** (PRD RB04) — Redis dedup existe, mas falta similaridade fuzzy
7. **🔵 Cache de Respostas** (PRD Risco 4) — Redis existe mas sem cache de respostas frequentes

## 3. Proposta de Abordagem

### Fase 1 — Fundação (3 dias)
Implementar os itens de infraestrutura que habilitam as features seguintes.

### Fase 2 — Experiência do Usuário (4 dias)
Features com impacto direto no usuário WhatsApp/Telegram.

### Fase 3 — Inteligência (5 dias)
Análise, aprendizado e dashboard.

## 4. Plano Passo-a-Passo

### Fase 1: Fundação

#### Task 1.1 — Cache de Respostas Frequentes
**Arquivos que mudam:**
- `apps/server/app/services/cache_service.py` **(novo)**
- `apps/server/app/core/config.py` (adicionar `CACHE_TTL` config)
- `apps/server/app/agents/orchestrator.py` (injetar cache no `build_response_node`)
- `apps/server/tests/test_cache.py` **(novo)**

**Implementação:**
1. Criar `CacheService` com Redis:
   - `get_cached_response(user_id: str, query_hash: str) -> str | None`
   - `set_cached_response(user_id: str, query_hash: str, response: str, ttl: int)`
   - Query hash via SHA256 do `user_id + message + intent`
   - TTL padrão: 5 minutos para consultas, 30s para registros
2. Injetar no `build_response_node`: antes de processar, verificar cache
3. Invalidar cache quando usuário corrige dados ou registra nova transação

**Testes:**
- Testar cache hit/miss
- Testar invalidação após correção
- Testar fallback sem Redis

---

#### Task 1.2 — Similaridade para Deduplicação
**Arquivos que mudam:**
- `apps/server/app/services/deduplication_service.py` **(novo)**
- `apps/server/app/agents/persistence.py` (injetar dedup)
- `apps/server/app/agents/normalization.py` (adicionar hash de similaridade)
- `apps/server/tests/test_deduplication.py` **(novo)**

**Implementação:**
1. Criar `DeduplicationService`:
   - `is_duplicate(user_id, amount, description, time_window=5min)` → bool
   - Usar Redis sorted set com timestamp para janela móvel
   - Similaridade fuzzy via `difflib.SequenceMatcher` na descrição
   - Threshold: 85% de similaridade + mesmo valor + mesma categoria
2. Injetar no `save_transaction_node`: verificar duplicidade antes de persistir
3. Se duplicata encontrada: responder "Essa transação parece já ter sido registrada. Confirma?"

**Testes:**
- Testar duplicata exata (mesmo valor, mesma descrição)
- Testar duplicata fuzzy ("Almoço no shopping" ≈ "Almoço shopping")
- Testar não-duplicata (valor diferente)
- Testar janela temporal

---

### Fase 2: Experiência do Usuário

#### Task 2.1 — Agente de Transcrição de Áudio Dedicado
**Arquivos que mudam:**
- `apps/server/app/agents/audio_transcriber.py` **(novo)**
- `apps/server/app/agents/orchestrator.py` (adicionar nó + aresta)
- `apps/server/app/agents/prompts/transcribe_audio.py` **(novo)**
- `apps/server/tests/test_audio_transcriber.py` **(novo)**

**Implementação:**
1. Extrair lógica de transcrição de `multimodal.py` para agente dedicado:
   - `AudioTranscriberAgent` com `transcribe(audio_path: str) -> str`
   - Usa Whisper/Groq para transcrição (já configurado no projeto)
   - Pós-processamento: limpeza de ruído, segmentação por frases
2. Criar prompt específico em `prompts/transcribe_audio.py`
3. Adicionar nó `transcribe_audio` no grafo LangGraph:
   - Entrada: mídia de áudio do webhook
   - Saída: texto transcrito + confiança
   - Roteia para `classify_intent` após transcrição
4. Atualizar `route_after_multimodal` para detectar áudio e rotear para transcrição

**Testes:**
- Testar transcrição simulada (mock do Whisper)
- Testar integração com orchestrator
- Testar fallback quando áudio é muito longo ou inaudível

---

#### Task 2.2 — Correção Inteligente pelo Usuário
**Arquivos que mudam:**
- `apps/server/app/agents/correction.py` **(novo)**
- `apps/server/app/agents/orchestrator.py` (substituir `correction_handler_node`)
- `apps/server/app/agents/prompts/correction.py` **(novo)**
- `apps/server/app/services/correction_service.py` **(novo)**
- `apps/server/tests/test_correction.py` **(novo)**

**Implementação:**
1. Criar `CorrectionService`:
   - `find_transaction_to_correct(user_id, user_message)` → transação candidata
   - Suporta correção por: valor, categoria, descrição, data
   - Usa LLM para interpretar "na verdade foi R$ 60" → extrair novo valor
2. Criar `correction.py` com lógica:
   - Se mensagem tem valor: `update_transaction_handler_node` (já existe)
   - Se mensagem tem categoria: atualizar categoria da transação
   - Se mensagem não tem dados claros: perguntar qual campo corrigir
3. Atualizar `correction_handler_node` no orchestrator para usar o novo serviço
4. Adicionar prompt de correção em `prompts/correction.py`

**Testes:**
- Testar "na verdade foi R$ 60" → atualiza valor
- Testar "era alimentação, não transporte" → atualiza categoria
- Testar mensagem ambígua → pede esclarecimento
- Testar usuário sem transações recentes → aviso apropriado

---

#### Task 2.3 — População do Perfil Financeiro
**Arquivos que mudam:**
- `apps/server/app/services/financial_profile_service.py` **(novo)**
- `apps/server/app/agents/persistence.py` (atualizar `save_transaction` para popular perfil)
- `apps/server/app/agents/orchestrator.py` (adicionar nó de perfil)
- `apps/server/tests/test_financial_profile.py` **(novo)**

**Implementação:**
1. Criar `FinancialProfileService`:
   - `update_profile(user_id)` → recalcula perfil financeiro
   - `get_profile(user_id)` → retorna perfil atual
   - Perfil contém:
     - `avg_monthly_income`: média de receitas (últimos 3 meses)
     - `avg_monthly_expenses`: média de despesas
     - `top_categories`: categorias com maiores gastos
     - `savings_rate`: (receitas - despesas) / receitas
     - `typical_transaction_day`: dia do mês com mais transações
     - `most_active_hour`: horário que mais registra
     - `last_updated`: timestamp
2. Atualizar `save_transaction_node` para chamar `update_profile` após salvar
3. Adicionar rota `GET /api/v1/profile` para expor o perfil
4. Perfil fica acessível para recomendações e deep research

**Testes:**
- Testar cálculo de médias mensais
- Testar top categorias
- Testar perfil vazio (usuário novo)
- Testar atualização incremental

---

### Fase 3: Inteligência

#### Task 3.1 — Aprendizado de Padrões
**Arquivos que mudam:**
- `apps/server/app/services/pattern_learning_service.py` **(novo)**
- `apps/server/app/agents/pattern_learning.py` **(novo)**
- `apps/server/app/agents/orchestrator.py` (adicionar nó opcional)
- `apps/server/tests/test_pattern_learning.py` **(novo)**

**Implementação:**
1. Criar `PatternLearningService`:
   - `record_pattern(user_id, transaction_type, category, hour, day_of_week)`
   - `get_suggested_category(user_id, amount, description)` → categoria sugerida
   - `get_common_patterns(user_id)` → lista de padrões
2. Algoritmo:
   - Manter contagem de `(hora, categoria)`, `(dia_semana, tipo)`
   - Se usuário sempre registra "Uber" como "Transporte" às 18h, aprender
   - Sugerir categoria automaticamente quando confiança > 80%
3. Adicionar nó opcional `pattern_learning` após `save_transaction`
4. Integrar com `normalization.py`: se padrão tem alta confiança, auto-atribuir categoria

**Testes:**
- Testar aprendizado de padrão horário
- Testar sugestão de categoria por similaridade
- Testar confiança abaixo do threshold

---

#### Task 3.2 — Dashboard Web Financeiro
**Arquivos que mudam:**
- `apps/server/app/templates/dashboard/` **(nova pasta)**
- `apps/server/app/api/routes/v1/dashboard.py` **(novo)**
- `apps/server/app/services/dashboard_service.py` **(novo)**
- `apps/server/tests/test_dashboard.py` **(novo)**

**Implementação:**
1. Criar `DashboardService`:
   - `get_dashboard_data(user_id, period)` → resumo completo
   - `get_transactions_list(user_id, page, filters)` → paginação
   - `get_category_chart(user_id, period)` → dados para gráfico
   - `get_budget_progress(user_id)` → progresso dos orçamentos
   - `get_goals_progress(user_id)` → progresso das metas
   - `get_reports_list(user_id)` → relatórios gerados
2. Criar rotas REST:
   - `GET /api/v1/dashboard/summary` → KPIs mensais
   - `GET /api/v1/dashboard/transactions` → lista paginada
   - `GET /api/v1/dashboard/categories` → gastos por categoria
   - `GET /api/v1/dashboard/budgets` → progresso orçamentos
   - `GET /api/v1/dashboard/goals` → progresso metas
   - `GET /api/v1/dashboard/reports` → relatórios PDF gerados
3. Template HTML (Jinja2) para visualização:
   - Dashboard responsivo (funciona no celular)
   - Cards com totais (receitas, despesas, saldo)
   - Gráfico de pizza por categoria (Chart.js ou similar)
   - Tabela de transações com busca/filtro
   - Progresso de orçamentos e metas
4. Atualizar menu do admin para linkar ao dashboard

**Testes:**
- Testar endpoints REST
- Testar agregações por período
- Testar template rendering

## 5. Estrutura Final Esperada

```
apps/server/app/
├── agents/
│   ├── audio_transcriber.py      (NOVO)
│   ├── correction.py             (NOVO)
│   ├── pattern_learning.py       (NOVO)
│   └── ... (existentes)
├── services/
│   ├── cache_service.py          (NOVO)
│   ├── deduplication_service.py  (NOVO)
│   ├── correction_service.py     (NOVO)
│   ├── financial_profile_service.py (NOVO)
│   ├── pattern_learning_service.py  (NOVO)
│   ├── dashboard_service.py      (NOVO)
│   └── ... (existentes)
├── agents/prompts/
│   ├── transcribe_audio.py       (NOVO)
│   └── correction.py             (NOVO)
├── api/routes/v1/
│   └── dashboard.py              (NOVO)
└── templates/dashboard/          (NOVO)
```

## 6. Dependências Externas

Nenhuma nova dependência. O projeto já tem:
- Redis (para cache e deduplicação)
- LLM (Groq/OpenCodeGo — para transcrição e correção)
- langgraph (para nós adicionais no grafo)
- Jinja2 (para templates do dashboard)

## 7. Testes e Validação

Cada task gera seu próprio arquivo de testes. No final:
```bash
make test  # ~220+ testes esperados
ruff check .  # sem regressões
```

## 8. Riscos e Tradeoffs

| Risco | Impacto | Mitigação |
|-------|---------|-----------|
| Dashboard consome muitas queries no PostgreSQL | Latência alta | Implementar cache (Task 1.1 primeiro) + paginação |
| Perfil financeiro recalcula a cada transação | Performance | Atualizar apenas após X transações ou a cada hora |
| Transcrição de áudio aumenta latência | Usuário espera mais | Processar em background com webhook de notificação |
| Aprendizado de padrões pode sugerir categoria errada | Frustração | Threshold mínimo de 80% + usuário sempre pode corrigir |

## 9. Ordem de Execução Sugerida

```
Semana 1:
  Seg: Task 1.1 (Cache de Respostas)
  Ter: Task 1.2 (Deduplicação)
  Qua: Task 2.1 (Transcrição de Áudio)
  Qui: Task 2.2 (Correção Inteligente)

Semana 2:
  Seg: Task 2.3 (Perfil Financeiro)
  Ter: Task 3.1 (Aprendizado de Padrões)
  Qua: Task 3.2 (Dashboard - backend)
  Qui: Task 3.2 (Dashboard - frontend/template)
  Sex: Testes integrados + deploy
```

## 10. Perguntas em Aberto

1. Dashboard web: deve ser uma SPA separada (React/Vue) ou templates Jinja2 server-side? Sugiro Jinja2 para MVP (menos dependências).
2. Transcrição de áudio: usar Whisper local (CPU pesado) ou API Groq (mais rápido, depende de chave)?
3. Perfil financeiro: deve ser exposto ao usuário no chat ("Seu perfil: você ganha ~R$ X por mês") ou só no dashboard?
