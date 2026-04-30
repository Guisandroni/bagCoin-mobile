"""Validação de contexto de tenant (usuário) para todos os nós com dados sensíveis.

Todo acesso a dados financeiros deve partir de um identificador de contato válido
(normalmente o telefone WhatsApp normalizado para dígitos).
"""

from __future__ import annotations

# Mínimo de dígitos para considerar um identificador utilizável (ex.: BR sem +55).
MIN_PHONE_DIGITS = 10


def tenant_phone_error(phone_number: str | None) -> str | None:
    """Retorna mensagem de erro em pt-BR se o telefone for inválido; senão None."""
    if phone_number is None:
        return "Não foi possível identificar o contato. Tente novamente."
    digits = "".join(c for c in str(phone_number) if c.isdigit())
    if len(digits) < MIN_PHONE_DIGITS:
        return (
            "Identificador de contato inválido ou incompleto. "
            "Verifique o número e tente novamente."
        )
    return None


def assert_valid_tenant_phone(phone_number: str | None) -> None:
    """Lança ValueError se o identificador de tenant for inválido."""
    err = tenant_phone_error(phone_number)
    if err:
        raise ValueError(err)
