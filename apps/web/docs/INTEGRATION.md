# Bagcoin Web — Integration Guide

> Shared context for all agents working on this project.

## API Base

```
http://localhost:8000/api/v1
```

## Authentication

- **JWT** via httpOnly cookies (`access_token` + `refresh_token`)
- Frontend also stores in memory + `document.cookie` as fallback
- Auto-refresh on 401 via Axios interceptor queue
- Auth flow: `/login` → `POST /auth/login` → set cookies → redirect `/`
- Logout: clear cookies → redirect `/login`

### Auth Endpoints

| Method | Route | Auth | Notes |
|--------|------|------|-------|
| POST | `/auth/register` | No | `{email, password, full_name?, phone_number?}` |
| POST | `/auth/login` | No | Form-urlencoded: `username` + `password` |
| POST | `/auth/google` | No | `{id_token: "..."}` |
| POST | `/auth/refresh` | No | `{refresh_token: "..."}` |
| GET | `/auth/me` | JWT | Returns `UserRead` |

## Transaction Endpoints (Integrated)

| Method | Route | Auth | Notes |
|--------|------|------|-------|
| GET | `/transactions/summary` | JWT | Dashboard aggregated data |
| GET | `/transactions` | JWT | List with `?skip=&limit=&type=&search=` |
| POST | `/transactions` | JWT | `{type, amount, description, category_name?, transaction_date?, source, status}` |
| GET | `/transactions/{id}` | JWT | Single transaction |
| PATCH | `/transactions/{id}` | JWT | Partial update |
| DELETE | `/transactions/{id}` | JWT | 204 No Content |

### Response Format

```json
{
  "id": "42",
  "name": "Supermercado Pão de Açúcar",
  "category": "Alimentação",
  "amount": -287.50,
  "date": "30 Abr",
  "source": "manual",
  "status": "confirmed"
}
```

## Not Yet Implemented (Use Mock Data)

| Feature | Status |
|---------|--------|
| Accounts/Card REST API | Needs backend models |
| Budget REST API | Backend only (WhatsApp) |
| Goals REST API | Backend only (WhatsApp) |
| Reports REST API | PDF generation needed |
| Category Management UI | Needs REST endpoints |

## Frontend Architecture

```
src/
├── app/
│   ├── layout.tsx          # Root (QueryProvider, ThemeProvider, Toaster)
│   ├── page.tsx            # Landing page
│   ├── login/page.tsx      # Auth (no guard)
│   ├── register/page.tsx   # Auth (no guard)
│   └── (dashboard)/        # Protected routes
│       ├── layout.tsx       # AuthGuard + AppShell
│       ├── page.tsx         # Dashboard
│       ├── transacoes/
│       ├── contas/
│       └── configuracoes/
├── components/
│   ├── ui/                 # shadcn/ui
│   ├── layout/             # AppShell, Sidebar, TopBar, BottomNav
│   ├── dashboard/          # BalanceCard, StatCards, etc.
│   ├── modals/             # NewTransaction, TransactionDetail, Filter
│   └── auth/               # LoginForm, RegisterForm, AuthGuard
├── hooks/use-transactions.ts  # TanStack Query hooks
├── lib/
│   ├── api-client.ts       # Axios + cookie auth + refresh interceptor
│   ├── auth-store.ts       # Zustand auth state
│   ├── store.ts            # Zustand UI state (modals, filters)
│   ├── query-client.tsx     # TanStack Query provider
│   ├── constants.ts        # Categories, brand, nav items
│   └── utils.ts            # cn() helpers
├── data/mock.ts            # Fallback data
└── types/index.ts           # TypeScript interfaces
```

## Key Decisions

1. **httpOnly cookies** for auth tokens (frontend sets via `document.cookie`, backend should set `Set-Cookie` headers in future)
2. **TanStack Query** for server state (transactions, summary) + **Zustand** for client state (modals, filters, UI)
3. **Mock data fallback** for pages without backend endpoints (accounts, cards, budgets, goals)
4. **Space Grotesk** for headings, **Inter** for body text
5. **Blue palette** (#2B75E5 / #0052ff) as primary brand color
6. Dark mode supported via next-themes

## Testing

- **Vitest** + @testing-library/react for unit/integration tests
- **Playwright** for E2E tests
- MSW for mocking API responses in tests