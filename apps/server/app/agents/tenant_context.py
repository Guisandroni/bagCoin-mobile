"""Tenant context validation for BagCoin agents.

All financial data access must originate from a valid contact identifier
(normalized phone number digits).

Every node that accesses sensitive data should call assert_valid_tenant_phone()
or check tenant_phone_error() early.
"""

from __future__ import annotations

# Minimum digits to consider a usable identifier
# WhatsApp numbers are international (country + area + number = 10+ digits).
# Telegram chat IDs can be shorter (9+ digits). 5 is safe for both.
MIN_PHONE_DIGITS = 5


def tenant_phone_error(phone_number: str | None) -> str | None:
    """Return error message in pt-BR if phone is invalid; None otherwise."""
    if phone_number is None:
        return "Não foi possível identificar o contato. Tente novamente."
    digits = "".join(c for c in str(phone_number) if c.isdigit())
    if len(digits) < MIN_PHONE_DIGITS:
        return (
            "Identificador de contato inválido ou incompleto. Verifique o número e tente novamente."
        )
    return None


def assert_valid_tenant_phone(phone_number: str | None) -> None:
    """Raise ValueError if the tenant identifier is invalid."""
    err = tenant_phone_error(phone_number)
    if err:
        raise ValueError(err)
