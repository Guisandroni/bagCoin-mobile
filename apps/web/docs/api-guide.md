# BagCoin API Guide — Frontend Integration

> Base URL: `http://localhost:8000/api/v1`

## Authentication Flow

### JWT Token Lifecycle

```
┌──────────────┐     POST /auth/login      ┌────────────────────┐
│   Frontend   │ ───────────────────────── │  access_token (30m) │
│              │ ◄─────────────────────────│  refresh_token (7d) │
└──────────────┘                           └────────────────────┘
       │
       │  Guarda tokens em localStorage
       │  Toda request → Authorization: Bearer <access_token>
       │
       │  401 → POST /auth/refresh (refresh_token)
       │  └── Novo par access_token + refresh_token
       │
       │  Refresh falha → redireciona para /login
```

### Endpoints

| Método | Rota | Auth | Request Body | Response |
|--------|------|------|-------------|----------|
| `POST` | `/auth/register` | No | `{email, password, full_name?, phone_number?}` | `UserRead` (201) |
| `POST` | `/auth/login` | No | Form URL-encoded: `username` + `password` | `{access_token, refresh_token, token_type: "bearer"}` |
| `POST` | `/auth/google` | No | `{id_token: "..."}` | `{access_token, refresh_token, token_type: "bearer"}` |
| `POST` | `/auth/refresh` | No | `{refresh_token: "..."}` | `{access_token, refresh_token, token_type: "bearer"}` |
| `GET` | `/auth/me` | JWT | — | `UserRead` |

### Register Request Examples

```json
// Email + senha + nome + telefone
{
  "email": "ana@email.com",
  "password": "12345678",
  "full_name": "Ana Silva",
  "phone_number": "+5511999999999"
}
```

### Login Request (Form Data)

```typescript
const formData = new URLSearchParams()
formData.append("username", email)
formData.append("password", password)

await axios.post("/api/v1/auth/login", formData, {
  headers: { "Content-Type": "application/x-www-form-urlencoded" }
})
```

### Google Login Request

```json
{
  "id_token": "eyJhbGciOiJSUzI1NiIsImtpZCI6..."
}
```

The backend verifies the Google ID token using `google-auth` library.
If the email is new, a user is created automatically. If the email exists, accounts are linked.

### User Object (UserRead)

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "email": "ana@email.com",
  "full_name": "Ana Silva",
  "phone_number": "+5511999999999",
  "is_active": true,
  "role": "user",
  "avatar_url": null,
  "auth_provider": "email",
  "created_at": "2026-05-01T00:00:00Z",
  "updated_at": "2026-05-01T00:00:00Z"
}
```

---

## Transactions REST API

All transaction endpoints require JWT auth (`Authorization: Bearer <token>`).

### Endpoints

| Método | Rota | Query Params | Request Body | Response |
|--------|------|-------------|-------------|----------|
| `GET` | `/transactions` | `skip`, `limit`, `type`, `search` | — | `{items: Transaction[], total: int}` |
| `GET` | `/transactions/summary` | — | — | `TransactionSummary` |
| `POST` | `/transactions` | — | `TransactionCreate` | `Transaction` (201) |
| `GET` | `/transactions/{id}` | — | — | `Transaction` |
| `PATCH` | `/transactions/{id}` | — | `TransactionUpdate` | `Transaction` |
| `DELETE` | `/transactions/{id}` | — | — | 204 No Content |

### Transaction Response Object

```json
{
  "id": "42",
  "name": "Supermercado Pão de Açúcar",
  "category": "Alimentação",
  "amount": -287.50,
  "date": "30 Abr",
  "source": "manual",
  "status": "confirmed",
  "created_at": "2026-05-01T12:00:00Z",
  "updated_at": "2026-05-01T12:00:00Z"
}
```

### Create Transaction

```json
POST /transactions
{
  "type": "EXPENSE",
  "amount": 287.50,
  "description": "Supermercado Pão de Açúcar",
  "category_name": "Alimentação",
  "transaction_date": "2026-04-30",
  "source": "manual",
  "status": "confirmed"
}
```

### Update Transaction

```json
PATCH /transactions/42
{
  "description": "Supermercado Pão de Açúcar - compras do mês",
  "category_name": "Alimentação",
  "status": "confirmed"
}
```

### Summary Response (Dashboard)

```json
GET /transactions/summary
{
  "balance": 3220.00,
  "total_income": 8500.00,
  "total_expenses": 5280.00,
  "transaction_count": 12,
  "categories": [
    {"name": "Alimentação", "amount": 350.30, "color": "#ff6b35"},
    {"name": "Transporte", "amount": 77.20, "color": "#0052ff"}
  ],
  "recent_transactions": [...]
}
```

---

## Error Responses

All errors follow this format:

```json
{
  "success": false,
  "error": "Email already registered",
  "detail": "The email you provided is already in use",
  "code": "ALREADY_EXISTS"
}
```

### HTTP Status Codes

| Status | Meaning |
|--------|---------|
| 200 | Success |
| 201 | Created |
| 204 | No Content (delete) |
| 400 | Bad Request |
| 401 | Authentication required / token expired |
| 403 | Insufficient permissions |
| 404 | Resource not found |
| 409 | Already exists (duplicate email) |
| 422 | Validation error |
| 429 | Rate limit exceeded |
| 500 | Internal server error |

---

## Frontend Implementation Guide

### 1. API Client Setup (already done)

The project already has:
- `src/lib/api-client.ts` — Axios instance with JWT interceptors
- `src/lib/auth-store.ts` — Zustand store for auth state
- `src/lib/query-client.tsx` — TanStack Query provider
- `src/hooks/use-transactions.ts` — React Query hooks for transactions
- `src/components/auth/auth-guard.tsx` — Route protection

### 2. How Token Refresh Works

The API client (`api-client.ts`) automatically handles token refresh:

1. Every request adds `Authorization: Bearer <access_token>` header
2. If server returns 401, the interceptor:
   - Calls `POST /auth/refresh` with the stored `refresh_token`
   - Updates tokens in localStorage
   - Retries the original request with the new token
3. If refresh also fails, redirects to `/login`

### 3. How to Add a New API Call

```typescript
import apiClient from "@/lib/api-client"

// GET
const { data } = await apiClient.get("/transactions?type=EXPENSE")

// POST
const { data } = await apiClient.post("/transactions", { ... })

// PATCH
const { data } = await apiClient.patch("/transactions/42", { ... })

// DELETE
await apiClient.delete("/transactions/42")
```

### 4. How to Use React Query

```typescript
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import apiClient from "@/lib/api-client"

// Read
function useTransactions() {
  return useQuery({
    queryKey: ["transactions"],
    queryFn: () => apiClient.get("/transactions").then(r => r.data),
  })
}

// Create
function useCreateTransaction() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data) => apiClient.post("/transactions", data).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["transactions"] }),
  })
}
```

### 5. Google OAuth Setup

1. Create a project in [Google Cloud Console](https://console.cloud.google.com)
2. Enable Google Identity API
3. Create OAuth 2.0 Client ID (Web application)
4. Add authorized JavaScript origins: `http://localhost:3000`
5. Set env vars:

```bash
# Backend .env
GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-xxx

# Frontend .env.local
NEXT_PUBLIC_GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com
```

### 6. Frontend Env Vars

Create `.env.local` in `apps/web/`:

```
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
NEXT_PUBLIC_GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com
```

---

## Currently Implemented Features

| Feature | Backend | Frontend |
|---------|---------|----------|
| Login (email/password) | ✅ | ✅ |
| Register (name, email, phone, password) | ✅ | ✅ |
| Google OAuth Login | ✅ | ✅ |
| JWT Refresh | ✅ | ✅ |
| Route Protection (AuthGuard) | ✅ | ✅ |
| Transaction CRUD | ✅ | ✅ |
| Dashboard Summary | ✅ | ✅ |
| Transaction List + Filters | ✅ | ✅ |
| User Profile (sidebar) | ✅ | ✅ |
| Logout | ✅ | ✅ |

## Not Yet Implemented

| Feature | Status |
|---------|--------|
| Budget REST API | Backend only (WhatsApp) |
| Goal REST API | Backend only (WhatsApp) |
| Category Management UI | Needs REST endpoints |
| Account/Card Management | Needs backend models |
| Avatar Upload | Backend ready, needs UI |
| AI Chat (WebSocket) | Backend ready, needs UI |
| Data Export | Backend ready, needs UI |
