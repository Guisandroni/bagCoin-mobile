#!/bin/bash
# BagCoin E2E Test Script
# Usage: bash scripts/test-e2e.sh
# Requires: docker compose running (docker compose up -d --build app db redis)

set -e
BASE="http://localhost:8000/api/v1"
PASS=0
FAIL=0

green() { echo -e "\033[32m$1\033[0m"; }
red()   { echo -e "\033[31m$1\033[0m"; }
blue()  { echo -e "\033[34m$1\033[0m"; }

assert_status() {
  local desc="$1" expected="$2" actual="$3"
  if [ "$actual" = "$expected" ]; then
    green "  PASS: $desc"
    PASS=$((PASS+1))
  else
    red "  FAIL: $desc (expected $expected, got $actual)"
    FAIL=$((FAIL+1))
  fi
}

assert_contains() {
  local desc="$1" key="$2" body="$3"
  if echo "$body" | grep -q "$key"; then
    green "  PASS: $desc"
    PASS=$((PASS+1))
  else
    red "  FAIL: $desc (missing '$key')"
    FAIL=$((FAIL+1))
  fi
}

# ── Health ──────────────────────────────────────────────────────────
blue "=== HEALTH ==="
RESP=$(curl -s -o /dev/null -w "%{http_code}" $BASE/health)
assert_status "Health endpoint" "200" "$RESP"

# ── Register ────────────────────────────────────────────────────────
blue "=== AUTH: Register ==="
REGISTER_BODY='{"email":"e2e-test@bagcoin.com","password":"test123456","full_name":"E2E Test","phone_number":"+5511999999999"}'
REGISTER=$(curl -s -w "\n%{http_code}" -X POST "$BASE/auth/register" \
  -H "Content-Type: application/json" -d "$REGISTER_BODY")
REGISTER_CODE=$(echo "$REGISTER" | tail -1)
REGISTER_BODY=$(echo "$REGISTER" | head -1)

if [ "$REGISTER_CODE" = "201" ] || [ "$REGISTER_CODE" = "200" ]; then
  green "  PASS: Register (HTTP $REGISTER_CODE)"
  PASS=$((PASS+1))
elif [ "$REGISTER_CODE" = "409" ]; then
  green "  PASS: Register - email exists (expected 409)"
  PASS=$((PASS+1))
else
  red "  FAIL: Register (HTTP $REGISTER_CODE)"
  echo "  $REGISTER_BODY"
  FAIL=$((FAIL+1))
fi

# ── Login ───────────────────────────────────────────────────────────
blue "=== AUTH: Login ==="
LOGIN=$(curl -s -w "\n%{http_code}" -X POST "$BASE/auth/login" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=e2e-test@bagcoin.com&password=test123456")
LOGIN_CODE=$(echo "$LOGIN" | tail -1)
LOGIN_BODY=$(echo "$LOGIN" | head -1)

if [ "$LOGIN_CODE" = "200" ]; then
  green "  PASS: Login"
  PASS=$((PASS+1))
  ACCESS_TOKEN=$(echo "$LOGIN_BODY" | python3 -c "import sys,json; print(json.load(sys.stdin)['access_token'])" 2>/dev/null)
  REFRESH_TOKEN=$(echo "$LOGIN_BODY" | python3 -c "import sys,json; print(json.load(sys.stdin)['refresh_token'])" 2>/dev/null)
  assert_contains "Login response has access_token" "access_token" "$LOGIN_BODY"
  assert_contains "Login response has refresh_token" "refresh_token" "$LOGIN_BODY"
else
  red "  FAIL: Login (HTTP $LOGIN_CODE) - $LOGIN_BODY"
  FAIL=$((FAIL+1))
  ACCESS_TOKEN=""
  REFRESH_TOKEN=""
fi

# ── Me ──────────────────────────────────────────────────────────────
blue "=== AUTH: Me ==="
if [ -n "$ACCESS_TOKEN" ]; then
  ME=$(curl -s -w "\n%{http_code}" "$BASE/auth/me" \
    -H "Authorization: Bearer $ACCESS_TOKEN")
  ME_CODE=$(echo "$ME" | tail -1)
  assert_status "GET /auth/me" "200" "$ME_CODE"
  ME_BODY=$(echo "$ME" | head -1)
  assert_contains "Me returns email" "email" "$ME_BODY"
fi

# ── Refresh ─────────────────────────────────────────────────────────
blue "=== AUTH: Refresh ==="
if [ -n "$REFRESH_TOKEN" ]; then
  REFRESH=$(curl -s -w "\n%{http_code}" -X POST "$BASE/auth/refresh" \
    -H "Content-Type: application/json" \
    -d "{\"refresh_token\":\"$REFRESH_TOKEN\"}")
  REFRESH_CODE=$(echo "$REFRESH" | tail -1)
  assert_status "POST /auth/refresh" "200" "$REFRESH_CODE"
  REFRESH_BODY=$(echo "$REFRESH" | head -1)
  ACCESS_TOKEN=$(echo "$REFRESH_BODY" | python3 -c "import sys,json; print(json.load(sys.stdin)['access_token'])" 2>/dev/null)
fi

# ── Google Login (invalid token → 401) ──────────────────────────────
blue "=== AUTH: Google ==="
GOOGLE=$(curl -s -w "\n%{http_code}" -X POST "$BASE/auth/google" \
  -H "Content-Type: application/json" \
  -d '{"id_token":"invalid-token"}')
GOOGLE_CODE=$(echo "$GOOGLE" | tail -1)
assert_status "Google login invalid token → 401" "401" "$GOOGLE_CODE"

# ── Transactions: Create ────────────────────────────────────────────
blue "=== TRANSACTIONS: Create ==="
if [ -n "$ACCESS_TOKEN" ]; then
  CREATE_EXPENSE=$(curl -s -w "\n%{http_code}" -X POST "$BASE/transactions" \
    -H "Authorization: Bearer $ACCESS_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"type":"EXPENSE","amount":150.50,"description":"Almoço restaurante","category_name":"Alimentação","transaction_date":"2026-05-01"}')
  CREATE_EXPENSE_CODE=$(echo "$CREATE_EXPENSE" | tail -1)
  assert_status "Create expense transaction" "201" "$CREATE_EXPENSE_CODE"
  EXPENSE_BODY=$(echo "$CREATE_EXPENSE" | head -1)
  TX_ID=$(echo "$EXPENSE_BODY" | python3 -c "import sys,json; print(json.load(sys.stdin)['id'])" 2>/dev/null)

  CREATE_INCOME=$(curl -s -w "\n%{http_code}" -X POST "$BASE/transactions" \
    -H "Authorization: Bearer $ACCESS_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"type":"INCOME","amount":5000,"description":"Salário Maio","category_name":"Salário","transaction_date":"2026-05-01"}')
  CREATE_INCOME_CODE=$(echo "$CREATE_INCOME" | tail -1)
  assert_status "Create income transaction" "201" "$CREATE_INCOME_CODE"
fi

# ── Transactions: List ──────────────────────────────────────────────
blue "=== TRANSACTIONS: List ==="
if [ -n "$ACCESS_TOKEN" ]; then
  LIST=$(curl -s -w "\n%{http_code}" "$BASE/transactions" \
    -H "Authorization: Bearer $ACCESS_TOKEN")
  LIST_CODE=$(echo "$LIST" | tail -1)
  LIST_BODY=$(echo "$LIST" | head -1)
  assert_status "List transactions" "200" "$LIST_CODE"
  assert_contains "List response has items" "items" "$LIST_BODY"
  assert_contains "List response has total" "total" "$LIST_BODY"
fi

# ── Transactions: Summary ──────────────────────────────────────────
blue "=== TRANSACTIONS: Summary ==="
if [ -n "$ACCESS_TOKEN" ]; then
  SUMMARY=$(curl -s -w "\n%{http_code}" "$BASE/transactions/summary" \
    -H "Authorization: Bearer $ACCESS_TOKEN")
  SUMMARY_CODE=$(echo "$SUMMARY" | tail -1)
  SUMMARY_BODY=$(echo "$SUMMARY" | head -1)
  assert_status "Get summary" "200" "$SUMMARY_CODE"
  assert_contains "Summary has balance" "balance" "$SUMMARY_BODY"
  assert_contains "Summary has total_income" "total_income" "$SUMMARY_BODY"
  assert_contains "Summary has total_expenses" "total_expenses" "$SUMMARY_BODY"
  assert_contains "Summary has categories" "categories" "$SUMMARY_BODY"
fi

# ── Transactions: Update ────────────────────────────────────────────
blue "=== TRANSACTIONS: Update ==="
if [ -n "$ACCESS_TOKEN" ] && [ -n "$TX_ID" ]; then
  UPDATE=$(curl -s -w "\n%{http_code}" -X PATCH "$BASE/transactions/$TX_ID" \
    -H "Authorization: Bearer $ACCESS_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"description":"Almoço restaurante - alterado","status":"confirmed"}')
  UPDATE_CODE=$(echo "$UPDATE" | tail -1)
  assert_status "Update transaction" "200" "$UPDATE_CODE"
fi

# ── Transactions: Get by ID ─────────────────────────────────────────
blue "=== TRANSACTIONS: Get by ID ==="
if [ -n "$ACCESS_TOKEN" ] && [ -n "$TX_ID" ]; then
  GET_ONE=$(curl -s -w "\n%{http_code}" "$BASE/transactions/$TX_ID" \
    -H "Authorization: Bearer $ACCESS_TOKEN")
  GET_ONE_CODE=$(echo "$GET_ONE" | tail -1)
  assert_status "Get transaction by ID" "200" "$GET_ONE_CODE"
fi

# ── Transactions: Delete ────────────────────────────────────────────
blue "=== TRANSACTIONS: Delete ==="
if [ -n "$ACCESS_TOKEN" ] && [ -n "$TX_ID" ]; then
  DELETE=$(curl -s -w "\n%{http_code}" -X DELETE "$BASE/transactions/$TX_ID" \
    -H "Authorization: Bearer $ACCESS_TOKEN")
  DELETE_CODE=$(echo "$DELETE" | tail -1)
  assert_status "Delete transaction" "204" "$DELETE_CODE"
fi

# ── Transactions: Auth Required ─────────────────────────────────────
blue "=== AUTH: Required ==="
NOAUTH_LIST=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/transactions")
assert_status "Transactions requires auth (no token)" "401" "$NOAUTH_LIST"

NOAUTH_CREATE=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE/transactions" \
  -H "Content-Type: application/json" -d '{"type":"EXPENSE","amount":10,"description":"test"}')
assert_status "Create transaction requires auth" "401" "$NOAUTH_CREATE"

NOAUTH_SUMMARY=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/transactions/summary")
assert_status "Summary requires auth" "401" "$NOAUTH_SUMMARY"

NOAUTH_DELETE=$(curl -s -o /dev/null -w "%{http_code}" -X DELETE "$BASE/transactions/999")
assert_status "Delete transaction requires auth" "401" "$NOAUTH_DELETE"

# ── Result ──────────────────────────────────────────────────────────
echo ""
echo "=============================================="
echo "  Results: $PASS passed, $FAIL failed"
echo "=============================================="

if [ "$FAIL" -gt 0 ]; then
  exit 1
fi
exit 0
