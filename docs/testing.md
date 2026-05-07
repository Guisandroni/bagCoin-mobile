# Testing Guide

## Running Tests

```bash
cd backend

# Run all tests
pytest

# Run with coverage
pytest --cov=app --cov-report=term-missing

# Run specific test file
pytest tests/api/test_health.py -v

# Run specific test
pytest tests/api/test_health.py::test_health_check -v

# Run only unit tests
pytest tests/unit/

# Run only integration tests
pytest tests/integration/

# Run with verbose output
pytest -v

# Stop on first failure
pytest -x
```

## Test Structure

```
tests/
├── conftest.py          # Shared fixtures
├── api/                 # API endpoint tests
│   ├── test_health.py
│   └── test_auth.py
├── unit/                # Unit tests (services, utils)
│   └── test_services.py
└── integration/         # Integration tests
    └── test_db.py
```

## Key Fixtures (`conftest.py`)

```python
# Database session for tests
@pytest.fixture
async def db_session():
    async with async_session() as session:
        yield session
        await session.rollback()

# Test client
@pytest.fixture
def client():
    return TestClient(app)

# Authenticated client
@pytest.fixture
async def auth_client(client, test_user):
    token = create_access_token(test_user.id)
    client.headers["Authorization"] = f"Bearer {token}"
    return client
```

## Writing Tests

### API Endpoint Test
```python
def test_health_check(client):
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"
```

### Service Test
```python
async def test_create_item(db_session):
    service = ItemService(db_session)
    item = await service.create(ItemCreate(name="Test"))
    assert item.name == "Test"
```

### Test with Authentication
```python
def test_protected_endpoint(auth_client):
    response = auth_client.get("/api/v1/users/me")
    assert response.status_code == 200
```

## Test Database

Tests use a separate test database or SQLite in-memory:
- Configuration in `tests/conftest.py`
- Database is reset between tests
- Use fixtures for test data

---

## Running Tests by Component

### Backend (Python / FastAPI)

```bash
# Run all backend tests
cd apps/server && uv run pytest tests/ -v

# Run only API endpoint tests (same as CI)
cd apps/server && uv run pytest tests/api/ -v

# Run with coverage
cd apps/server && uv run pytest tests/ -v --cov=app --cov-report=term-missing

# Run a specific test file
cd apps/server && uv run pytest tests/api/test_health.py -v

# Ruff lint check
cd apps/server && uv run ruff check app tests cli
```

### Frontend (Next.js / Vitest)

```bash
cd apps/web

# Run Vitest unit tests
npm run test

# Run with watch mode
npm run test:watch
```

### Playwright (E2E)

```bash
cd apps/web

# Run Playwright end-to-end tests
npm run test:e2e

# Or directly:
npx playwright test

# Run with UI mode
npx playwright test --ui
```

> **Note:** Playwright expects a dev server running on `http://localhost:3000`. The `playwright.config.ts` is configured to auto-start the server via `npm run dev`.

### WhatsApp Bridge

```bash
cd apps/whatsapp-bridge

# Run vitest tests
npx vitest run

# Or via npm:
npm run test

# Run with watch mode
npm run test:watch
```

## Test Coverage Matrix

### Backend — API Endpoints (`apps/server/tests/api/`)

| Endpoint / Module          | Test File                            | Status |
|----------------------------|--------------------------------------|--------|
| Health Check               | `test_health.py`                     | ✅     |
| Authentication             | `test_auth.py`                       | ✅     |
| Users                      | `test_users.py`                      | ✅     |
| Accounts                   | `test_accounts.py`                   | ✅     |
| Transactions               | `test_transactions.py`               | ✅     |
| Budgets                    | `test_budgets.py`                    | ✅     |
| Goals                      | `test_goals.py`                      | ✅     |
| Reports                    | `test_reports.py`                    | ✅     |
| Categories                 | `test_categories.py`                 | ✅     |
| Credit Cards               | `test_credit_cards.py`               | ✅     |
| Conversations              | `test_conversations.py`              | ✅     |
| Files                      | `test_files.py`                      | ✅     |
| Webhook                    | `test_webhook.py`                    | ✅     |
| Metrics                    | `test_metrics.py`                    | ✅     |
| OpenAPI Schema             | `test_openapi.py`                    | ✅     |
| Sync Flow                  | `test_sync_flow.py`                  | ✅     |
| Exceptions / Error Handling| `test_exceptions.py`                 | ✅     |
| BagCoin — Accounts         | `test_bagcoin_accounts.py`           | ✅     |
| BagCoin — Budgets          | `test_bagcoin_budgets.py`            | ✅     |
| BagCoin — Conversations    | `test_bagcoin_conversations.py`      | ✅     |
| BagCoin — Credit Cards     | `test_bagcoin_credit_cards.py`       | ✅     |
| BagCoin — Goals            | `test_bagcoin_goals.py`              | ✅     |
| BagCoin — Reports          | `test_bagcoin_reports.py`            | ✅     |

### Frontend — Unit Tests (`apps/web/src/__tests__/`)

| Module / Component         | Test File(s)                                              | Status |
|----------------------------|-----------------------------------------------------------|--------|
| API Client                 | `api.test.ts`                                             | ✅     |
| Auth                       | `auth.test.tsx`                                           | ✅     |
| Dashboard                  | `dashboard.test.tsx`                                      | ✅     |
| Store (Zustand)            | `store.test.ts`                                           | ✅     |
| Utils                      | `utils.test.ts`                                           | ✅     |
| Components — App Shell     | `components/app-shell.test.tsx`                           | ✅     |
| Components — Dashboard Cards| `components/dashboard-cards.test.tsx`                    | ✅     |
| Components — Empty State   | `components/empty-state.test.tsx`                         | ✅     |
| Components — Modals        | `components/modals.test.tsx`                              | ✅     |
| Hooks — Accounts           | `hooks/accounts.test.tsx`                                 | ✅     |
| Hooks — Budgets            | `hooks/budgets.test.tsx`                                  | ✅     |
| Hooks — Conversations      | `hooks/conversations.test.tsx`                            | ✅     |
| Hooks — Credit Cards       | `hooks/credit-cards.test.tsx`                             | ✅     |
| Hooks — Goals              | `hooks/goals.test.tsx`                                    | ✅     |
| Hooks — Reports            | `hooks/reports.test.tsx`                                  | ✅     |
| Hooks — Transactions       | `hooks/transactions.test.tsx`                             | ✅     |

### WhatsApp Bridge (`apps/whatsapp-bridge/src/__tests__/`)

| Module                     | Test File                            | Status |
|----------------------------|--------------------------------------|--------|
| API Client                 | `api.test.ts`                        | ✅     |
| Deduplication Logic        | `dedup.test.ts`                      | ✅     |
| Utilities                  | `utils.test.ts`                      | ✅     |

### E2E — Playwright (`apps/web/e2e/`)

| Test                       | File                      | Status |
|----------------------------|---------------------------|--------|
| App Smoke / Navigation     | `app.spec.ts`             | ✅     |

## CI Pipeline

The CI/CD pipeline is defined in `.github/workflows/test.yml` and runs on every push/PR to `main`/`master`. It includes:

1. **backend** — Python setup via `uv`, Ruff lint check, then `pytest tests/api/` against a PostgreSQL + Redis service
2. **frontend** — Node.js setup, `npm ci`, lint (non-fatal), build, then `vitest run`
3. **e2e** — Node.js setup, Playwright browser install, then `npx playwright test`

To trigger the pipeline manually: push to a branch and open a PR, or push directly to `main`/`master`.

## Makefile Targets

| Target                | Description                                         |
|-----------------------|-----------------------------------------------------|
| `test-backend`        | Run backend API tests (`pytest tests/api/`)         |
| `test-frontend`       | Run frontend Vitest tests                           |
| `test-e2e`            | Run Playwright end-to-end tests                     |
| `test-whatsapp-bridge`| Run WhatsApp Bridge vitest tests                    |
| `test-all`            | Run all of the above                                |
| `lint`                | Ruff check on backend code                          |
