# Plano de Integração Frontend ↔ Backend

## Regras de Mutação (CRUD)

Apenas estas entidades permitem criar/editar/deletar:
- **Orçamentos** (budgets por categoria) — CRUD completo
- **Metas** (goals) — CRUD completo
- **Perfil do usuário** — editar nome/email/senha

Todos os outros dados são **somente leitura**:
- Transações — read-only (exibidas, não criadas pelo frontend)
- Categorias — read-only (vêm do backend via summary)
- Relatórios — read-only (listados, download de PDF)
- Contas/Cartões — read-only por enquanto

---

## Fase 1: Corrigir Contratos de Tipos — ✅ CONCLUÍDA

### 1.1 ServerGoal: `name` → `title`
- ✅ `src/lib/api-server.ts` — `ServerGoal.title`
- ✅ `src/lib/adapters.ts` — `goal.title` mapping
- ✅ `src/lib/mock-api.ts` — `title: g.name`

### 1.2 Relatórios: usar adapter padrão
- ✅ `src/app/app/relatorios/page.tsx` — `serverReportToRelease()`
- ✅ `src/app/app/relatorios/relatorios-client.tsx` — Release ReportsView

### 1.3 CSRF + Extração de Erro no api-client.ts
- ✅ CSRF token interceptor (cookie → X-CSRF-Token header)
- ✅ `extractErrorMessage()` function para `{ error: { message } }` format

### 1.4 Padronizar use-transactions.ts
- ✅ Usa `api` wrapper em vez de raw `apiClient`

---

## Fase 2: Ligar Backend — ✅ CONCLUÍDA

### 2.1 USE_MOCK_DATA = false

### 2.2 Backend FK Fix: `user_id` NULLABLE
- ✅ `goals.user_id` → `nullable=True` (model + migration)
- ✅ `budgets.user_id` → `nullable=True` (model + migration)
- ✅ `reports.user_id` → `nullable=True` (model + migration)
- ✅ `goal.repo` — removido `user_id or 0`
- ✅ `budget.repo` — removido `user_id or 0`
- ✅ `budget.repo` — adicionado `selectinload(Budget.category)` (fix MissingGreenlet)

### 2.3 Seed de Dados
- ✅ `seed_financial.py` — 2 usuários com dados completos
  - **Ana Silva** (ana@bagcoin.com / bagcoin123)
  - **Carlos Oliveira** (carlos@bagcoin.com / bagcoin123)
- ✅ Cada user: phone_user linked, categories, transactions, goals, budgets, accounts, credit cards

### 2.4 Testado por Página (via API)
| Página | Endpoint(s) | Status |
|--------|-------------|--------|
| Dashboard | summary + budgets + goals | ✅ |
| Transações | GET /transactions | ✅ |
| Orçamentos | GET /budgets | ✅ (fix MissingGreenlet) |
| Metas | GET /goals | ✅ |
| Categorias | GET /transactions/summary | ✅ |
| Relatórios | GET /reports | ✅ |
| Contas | GET /accounts | ✅ |
| Cartões | GET /credit-cards | ✅ |

### 2.5 Auth Error Handling
- ✅ Login/register/Google login usam `error.error.message` format
- ✅ ApiClient interceptor extrai mensagens de erro uniformemente

---

## Fase 3: Cleanup — PENDENTE

- Remover condicionais `USE_MOCK_DATA` dos hooks (8 arquivos)
- Remover `src/lib/mock-api.ts` e `src/data/seed.ts`
- Remover mocks dos server fetchers em `api-server.ts`
- Remover `src/lib/feature-flags.ts` (ou só a export USE_MOCK_DATA)
- Atualizar testes que importam mock data
- Build final limpo + testes