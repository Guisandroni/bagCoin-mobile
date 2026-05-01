# Plano de Implementação — Fechar Gaps do PRD no bagcoin_api

> **For Hermes/Human:** Use `subagent-driven-development` para executar tarefa por tarefa.
> **Meta:** Fechar os 5 gaps identificados na análise PRD × Implementação.
> **Prioridade:** Gaps funcionais > Gaps de qualidade > Gaps de interface

---

## 📋 Visão Geral

### Gaps a Fechar

| # | Gap | Prioridade | Complexidade | Esforço |
|---|-----|-----------|-------------|---------|
| 1 | 🟡 **Correção Inteligente** (RB09) | 🔥 Alta | Baixa | ~15min |
| 2 | 🟡 **Prevenção de Duplicidade** (RB04) | 🔥 Alta | Média | ~20min |
| 3 | 🔴 **Aprendizado de Padrões** (RB10) | ⚠️ Média | Alta | ~40min |
| 4 | 🟡 **Rotas REST Categorias** (RF13) | ⚠️ Média | Baixa | ~15min |
| 5 | 🔴 **Dashboard Web** | ✨ Baixa | Muito Alta | ~2h+ |

### Dependências entre tarefas

```
Fase 1 (Correção + Dedup) —— sem dependências entre si, podem rodar em paralelo
         |
Fase 2 (Aprendizado) —— depende do dedup funcionando (evita duplicatas no padrão)
         |
Fase 3 (Rotas REST) —— independente
         |
Fase 4 (Dashboard) —— independente, mas grande
```

---

## Fase 1: 🔥 Correção Inteligente (RB09)

### Task 1.1: Expandir `correction_handler_node` para aceitar categoria e descrição

**Objetivo:** O nó de correção atual só detecta valor (`R$ 60`). Queremos que entenda também "era Alimentação" ou "corrige para 'mercado'".

**Arquivos:**
- Modificar: `apps/server/app/agents/orchestrator.py:356-371` (correction_handler_node)

**Passo a passo:**

1. Ler o nó atual (`correction_handler_node` em `orchestrator.py`)

```python
def correction_handler_node(state: AgentState) -> AgentState:
    phone_number = state.get("phone_number", "")
    message = state.get("message", "")
    import re as regex
    amount_match = regex.search(r"R?\$\s*(\d{1,3}(?:[.,]\d{3})*[.,]\d{1,2}|\d+(?:[.,]\d{1,2})?)", message)
    if amount_match:
        return update_transaction_handler_node(state)
    else:
        state["response"] = "Qual valor correto? Envie a correção, ex: 'na verdade foi R$ 60'"
    return state
```

2. Substituir por uma versão que detecta 3 tipos de correção:

```python
def correction_handler_node(state: AgentState) -> AgentState:
    """Nó de correção de transação — suporta valor, categoria, descrição."""
    import re as regex
    from app.agents.persistence import list_categories
    
    phone_number = state.get("phone_number", "")
    message = state.get("message", "")
    msg_lower = message.lower()
    
    # 1. Correção de valor: "R$ 50" ou "foi R$ 50"
    amount_match = regex.search(
        r"R?\$\s*(\d{1,3}(?:[.,]\d{3})*[.,]\d{1,2}|\d+(?:[.,]\d{1,2})?)", message
    )
    if amount_match:
        return update_transaction_handler_node(state)
    
    # 2. Correção de categoria: "era Alimentação" / "categoria certa é Transporte"
    for pattern in [
        r"(?:era|categoria\s+(?:certa|correta)\s+[ée])\s+([a-zA-ZÀ-ÿ\s]+)",
        r"(?:corrige|muda)\s+(?:a\s+)?categoria\s+(?:para|como)\s+([a-zA-ZÀ-ÿ\s]+)",
    ]:
        match = regex.search(pattern, msg_lower)
        if match:
            category_name = match.group(1).strip().capitalize()
            # Retorna o nome da categoria para ser usado no update_transaction
            state["extracted_data"] = {"category_name": category_name}
            return update_transaction_handler_node(state)
    
    # 3. Correção de descrição: "o nome é mercado"
    desc_match = regex.search(r"(?:o\s+)?nome\s+(?:[ée]|certo\s+[ée])\s+(.+)", msg_lower)
    if desc_match:
        state["extracted_data"] = {"description": desc_match.group(1).strip()}
        return update_transaction_handler_node(state)
    
    # Fallback: pergunta o que corrigir
    state["response"] = (
        "O que você quer corrigir?\\n"
        "• Valor: 'era R$ 60'\\n"
        "• Categoria: 'era Alimentação'\\n"
        "• Descrição: 'o nome é Mercado'"
    )
    return state
```

3. **Verificação:** Testar com mensagens de correção:
- `"Na verdade foi R$ 60"` → roteia para `update_transaction`
- `"Era Alimentação"` → extrai categoria e roteia
- `"Corrige a categoria para Transporte"` → extrai categoria
- `"O nome é Mercado"` → extrai descrição
- `"Mudou"` → fallback, pergunta o que corrigir

### Task 1.2: Garantir que `update_transaction` aceite `extracted_data`

**Objetivo:** O `update_transaction_handler_node` já usa `update_transaction()` que aceita `amount`, `description` e `category_name`. Precisa ler do `extracted_data` também.

**Arquivos:**
- Verificar: `orchestrator.py:198-210` (update_transaction_handler_node)
- Verificar: `persistence.py:252-285` (update_transaction)

**Verificação:**
- `update_transaction()` em `persistence.py` já aceita `amount`, `description`, `category_name`
- O `update_transaction_handler_node` precisa passar `extracted_data` para essa função
- Pode ser necessário modificar `update_transaction_handler_node` para ler `state["extracted_data"]` e chamar `update_transaction` com os campos corretos

---

## Fase 1: 🔥 Prevenção de Duplicidade (RB04)

### Task 1.3: Criar serviço de deduplicação fuzzy

**Objetivo:** Antes de salvar uma transação, verificar se existe alguma similar nos últimos 5 minutos.

**Arquivos:**
- Criar: `apps/server/app/services/deduplication_service.py`
- Modificar: `apps/server/app/agents/persistence.py` (save_transaction)

**Passo a passo:**

1. Criar `services/deduplication_service.py`:

```python
"""Deduplication service — fuzzy matching to prevent duplicate transactions."""

import logging
from datetime import datetime, timedelta

from difflib import SequenceMatcher

from app.agents.persistence import (
    get_user_transactions,
    get_or_create_user,
)
from app.db.session import sync_session_maker

logger = logging.getLogger(__name__)

# Threshold for similarity (0.0 to 1.0)
SIMILARITY_THRESHOLD = 0.85
# Time window in minutes
TIME_WINDOW_MINUTES = 5


def is_duplicate(phone_number: str, amount: float, description: str, category: str = "") -> bool:
    """Check if a similar transaction exists within the time window."""
    recent = get_user_transactions(phone_number, limit=20)
    cutoff = datetime.utcnow() - timedelta(minutes=TIME_WINDOW_MINUTES)
    
    for tx in recent:
        # Must be same amount
        if abs(float(tx.amount) - float(amount)) > 0.01:
            continue
        
        # Must be within time window
        if tx.transaction_date and tx.transaction_date < cutoff:
            continue
        
        # Description must be similar
        if description and tx.description:
            ratio = SequenceMatcher(
                None, 
                description.lower(), 
                tx.description.lower()
            ).ratio()
            if ratio >= SIMILARITY_THRESHOLD:
                logger.info(
                    f"Duplicate detected: {description} ~= {tx.description} (ratio={ratio:.2f})"
                )
                return True
    
    return False
```

2. Modificar `persistence.py:save_transaction()` para chamar `is_duplicate()`:

No início de `save_transaction()`, depois de extrair `amount`, `description`, `category_name`, adicionar:

```python
# Dedup check
if description and not state.get("skip_dedup", False):
    from app.services.deduplication_service import is_duplicate
    if is_duplicate(phone_number, amount, description, category_name):
        state["response"] = f"Já registrei uma despesa similar de R$ {amount:.2f} há pouco. Foi duplicado?"
        state["skip_dedup"] = True  # Se usuário confirmar, pula o check
        logger.info(f"Dedup triggered for {phone_number}: R$ {amount} - {description}")
        return state
```

**Verificação:**
- Enviar "Gastei R$ 50 no mercado" duas vezes seguidas → segunda é bloqueada
- Enviar "Gastei R$ 50 no mercado" e "Gastei R$ 50 no supermercado" → similar o suficiente para bloquear
- Enviar "Gastei R$ 50 no mercado" e "Gastei R$ 30 no mercado" → valores diferentes, permite

---

## Fase 2: ⚠️ Aprendizado de Padrões (RB10)

### Task 2.1: Criar sistema de aprendizado de padrões

**Objetivo:** Extrair e armazenar preferências do usuário: categorias mais usadas, horários de registro, palavras-chave frequentes.

**Arquivos:**
- Criar: `apps/server/app/services/pattern_learning_service.py`
- Modificar: `apps/server/app/agents/persistence.py`

**Passo a passo:**

1. Criar `services/pattern_learning_service.py`:

```python
"""Pattern learning service — learns user habits from transaction patterns."""

import logging
from collections import Counter
from datetime import datetime

from app.agents.persistence import get_user_transactions

logger = logging.getLogger(__name__)


def learn_from_transaction(phone_number: str, amount: float, category: str, description: str):
    """Update user patterns after a new transaction."""
    # Get recent transactions for analysis
    transactions = get_user_transactions(phone_number, limit=100)
    if not transactions:
        return
    
    # 1. Count categories (most used)
    cat_counter = Counter()
    # 2. Detect common spending times
    hour_counter = Counter()
    # 3. Common keywords
    keyword_counter = Counter()
    
    for tx in transactions:
        cat_counter[tx.category_name or "Outros"] += 1
        if tx.transaction_date:
            hour_counter[tx.transaction_date.hour] += 1
        if tx.description:
            words = tx.description.lower().split()
            keyword_counter.update(words)
    
    patterns = {
        "top_categories": [cat for cat, _ in cat_counter.most_common(5)],
        "preferred_hour": hour_counter.most_common(1)[0][0] if hour_counter else 12,
        "common_keywords": [kw for kw, _ in keyword_counter.most_common(10) if len(kw) > 3],
        "total_transactions": len(transactions),
        "last_updated": datetime.utcnow().isoformat(),
    }
    
    # Store patterns in PhoneUser.preferences JSON
    from app.db.session import sync_session_maker
    from app.agents.persistence import get_or_create_user
    from sqlalchemy.orm.attributes import flag_modified
    
    db = sync_session_maker()
    try:
        user = get_or_create_user(phone_number, db)
        prefs = user.preferences or {}
        prefs["learned_patterns"] = patterns
        user.preferences = prefs
        flag_modified(user, "preferences")
        db.commit()
        logger.info(f"Patterns learned for {phone_number}: {len(patterns['top_categories'])} top cats")
    except Exception as e:
        db.rollback()
        logger.error(f"Error learning patterns: {e}")
    finally:
        db.close()
```

2. Modificar `persistence.py:save_transaction()` para chamar após salvar:

```python
# Após salvar (junto com o update_financial_profile_sync)
try:
    from app.services.pattern_learning_service import learn_from_transaction
    learn_from_transaction(phone_number, amount, category_name, description)
except Exception:
    pass
```

**Verificação:**
- Salvar 5 transações na mesma categoria → `top_categories` deve refletir
- Salvar transações em horários diferentes → `preferred_hour` identifica o mais comum
- Verificar que `PhoneUser.preferences["learned_patterns"]` existe no banco

### Task 2.2: Usar padrões aprendidos nas recomendações

**Objetivo:** Injetar os padrões aprendidos no prompt de recomendações.

**Arquivos:**
- Modificar: `apps/server/app/agents/recommendations.py`

**Passo a passo:**
- No `recommendations.py`, ler `user.preferences.get("learned_patterns", {})` e incluir no prompt do LLM
- Por exemplo: "Sabemos que você gasta mais em {top_categories} e costuma registrar às {preferred_hour}h"

**Verificação:**
- Após ter padrões aprendidos, pedir recomendação → deve mencionar os padrões

---

## Fase 3: ⚠️ Rotas REST para Categorias (RF13)

### Task 3.1: Criar endpoints REST de categorias

**Objetivo:** Criar endpoints `/api/v1/categories` com CRUD completo.

**Arquivos:**
- Criar: `apps/server/app/api/routes/v1/categories.py`

**Passo a passo:**

1. Criar `api/routes/v1/categories.py`:

```python
"""REST routes for Category CRUD."""

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, get_db
from app.repositories.category import CategoryRepository
from app.schemas.category import CategoryCreate, CategoryResponse
from app.schemas.common import MessageResponse

router = APIRouter(prefix="/categories", tags=["categories"])


@router.get("/", response_model=list[CategoryResponse])
async def list_categories(
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    repo = CategoryRepository(db)
    return await repo.list_by_user(current_user.id)


@router.post("/", response_model=CategoryResponse, status_code=201)
async def create_category(
    data: CategoryCreate,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    repo = CategoryRepository(db)
    return await repo.create(user_id=current_user.id, name=data.name)


@router.delete("/{category_id}", response_model=MessageResponse)
async def delete_category(
    category_id: int,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    repo = CategoryRepository(db)
    await repo.delete(category_id, user_id=current_user.id)
    return MessageResponse(message="Category deleted")
```

2. Registrar no `api/routes/v1/__init__.py`:

```python
from app.api.routes.v1.categories import router as categories_router
v1_router.include_router(categories_router)
```

**Verificação:**
- `GET /api/v1/categories` → lista categorias do usuário autenticado
- `POST /api/v1/categories {"name": "Academia"}` → cria categoria
- `DELETE /api/v1/categories/1` → remove categoria

---

## Fase 4: ✨ Dashboard Web

> **Nota:** Dashboard web é um projeto grande (+2h). Recomendo adiar para depois dos gaps funcionais.

### Proposta — Abordagem Mínima

1. Criar templates HTML com Jinja2 em `apps/server/app/templates/dashboard/`
2. Endpoints REST em `apps/server/app/api/routes/v1/dashboard.py`
3. Páginas:
   - `/dashboard` — Visão geral com cards (saldo, receitas, despesas)
   - `/dashboard/transactions` — Tabela de transações com filtros
   - `/dashboard/budgets` — Progresso dos orçamentos
   - `/dashboard/goals` — Progresso das metas

### Ou usar ferramentas já instaladas

Já temos instalados:
- **Hermes Workspace** — web UI que poderia ser adaptada
- **Mission Control** — painel de orquestração multi-agente

Ambos são **painéis administrativos**, não dashboards financeiros específicos. Mas poderiam ser integrados.

---

## 📊 Resumo do Plano

| Fase | Task | Arquivos | Esforço | Depende de |
|------|------|----------|---------|------------|
| **1A** | 1.1 Expandir correção | `orchestrator.py` | ~10min | — |
| **1A** | 1.2 update_transaction aceitar extraídos | `orchestrator.py` | ~5min | Task 1.1 |
| **1B** | 1.3 Serviço de dedup fuzzy | `services/deduplication_service.py` + `persistence.py` | ~20min | — |
| **2** | 2.1 Aprendizado de padrões | `services/pattern_learning_service.py` + `persistence.py` | ~25min | Task 1.3 |
| **2** | 2.2 Padrões nas recomendações | `recommendations.py` | ~15min | Task 2.1 |
| **3** | 3.1 Rotas REST categorias | `api/routes/v1/categories.py` | ~15min | — |
| **4** | 4.1 Dashboard web | Vários | ~2h+ | — |

---

## ⚠️ Riscos e Tradeoffs

1. **Dedup fuzzy pode bloquear transações legítimas** — Se o threshold for muito baixo (ex: 0.7), compras similares em estabelecimentos diferentes (ex: dois mercados) seriam bloqueadas. O threshold de 0.85 é conservador.

2. **Aprendizado de padrões adiciona latência no save** — A chamada `learn_from_transaction()` faz queries adicionais. Como é síncrona, pode aumentar o tempo de resposta. Solução: rodar em background thread ou Celery task.

3. **Dashboard web replica lógica já existente** — As queries de dashboard já existem no `text_to_sql.py` e `reports.py`. O dashboard seria apenas uma nova camada de apresentação.

4. **Ordem sugerida:** Fase 1 → Fase 2 → Fase 3 → Fase 4. Fases 1A e 1B podem rodar em paralelo (arquivos diferentes).
