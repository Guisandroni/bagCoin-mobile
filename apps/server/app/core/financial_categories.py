"""Shared financial category taxonomy used by web and agents."""

from __future__ import annotations

import unicodedata
from dataclasses import dataclass


@dataclass(frozen=True)
class FinancialCategory:
    name: str
    color: str
    type: str
    emoji: str
    aliases: tuple[str, ...] = ()


DEFAULT_FINANCIAL_CATEGORIES: tuple[FinancialCategory, ...] = (
    FinancialCategory("Alimentação", "#ff9800", "despesa", "🍽️", ("comida", "lanche", "padaria", "feira")),
    FinancialCategory("Supermercado", "#f59e0b", "despesa", "🛒", ("mercado", "hortifruti")),
    FinancialCategory("Restaurantes", "#ef4444", "despesa", "🍴", ("restaurante", "bar", "cafeteria", "jantar", "almoco", "pizza")),
    FinancialCategory("Delivery", "#fb7185", "despesa", "🍔", ("ifood", "rappi", "uber eats")),
    FinancialCategory("Transporte", "#4285f4", "despesa", "🚗", ("uber", "99", "taxi", "onibus", "metro", "passagem")),
    FinancialCategory("Combustível", "#2563eb", "despesa", "⛽", ("gasolina", "alcool", "etanol", "diesel")),
    FinancialCategory("Estacionamento", "#60a5fa", "despesa", "🅿️", ("pedagio", "zona azul")),
    FinancialCategory("Moradia", "#7c3aed", "despesa", "🏠", ("casa", "reforma", "manutencao")),
    FinancialCategory("Aluguel", "#8b5cf6", "despesa", "🏘️", ("condominio", "financiamento")),
    FinancialCategory("Luz", "#facc15", "despesa", "💡", ("energia", "eletricidade")),
    FinancialCategory("Água", "#06b6d4", "despesa", "💧", ("agua", "esgoto")),
    FinancialCategory("Internet", "#0ea5e9", "despesa", "🌐", ("wifi", "fibra", "banda larga")),
    FinancialCategory("Telefone", "#38bdf8", "despesa", "📱", ("celular", "recarga", "tim", "vivo", "claro", "oi")),
    FinancialCategory("Saúde", "#ef4444", "despesa", "🏥", ("medico", "consulta", "exame", "hospital")),
    FinancialCategory("Farmácia", "#f43f5e", "despesa", "💊", ("farmacia", "remedio", "medicamento")),
    FinancialCategory("Plano de Saúde", "#fb7185", "despesa", "🩺", ("plano de saude", "convenio")),
    FinancialCategory("Educação", "#22c55e", "despesa", "🎓", ("faculdade", "escola", "livro", "material escolar")),
    FinancialCategory("Cursos", "#16a34a", "despesa", "📚", ("curso", "idioma", "aula")),
    FinancialCategory("Lazer", "#a855f7", "despesa", "🎮", ("cinema", "show", "teatro", "festa", "hobby", "jogo")),
    FinancialCategory("Assinaturas", "#9333ea", "despesa", "🎬", ("netflix", "spotify", "youtube", "streaming", "saas")),
    FinancialCategory("Viagem", "#3498db", "despesa", "✈️", ("turismo", "passeio", "passagem aerea")),
    FinancialCategory("Hospedagem", "#0ea5e9", "despesa", "🏨", ("hotel", "airbnb", "pousada")),
    FinancialCategory("Compras", "#ec4899", "despesa", "🛍️", ("shopping", "loja")),
    FinancialCategory("Vestuário", "#db2777", "despesa", "👕", ("roupa", "calcado", "sapato", "camiseta")),
    FinancialCategory("Beleza", "#f472b6", "despesa", "💅", ("salao", "barbearia", "manicure", "cosmetico")),
    FinancialCategory("Tecnologia", "#64748b", "despesa", "💻", ("eletronico", "computador", "software", "app", "console")),
    FinancialCategory("Pet", "#f97316", "despesa", "🐾", ("racao", "veterinario", "petshop")),
    FinancialCategory("Doações", "#84cc16", "despesa", "🤝", ("doacao", "caridade", "igreja", "ong")),
    FinancialCategory("Impostos", "#dc2626", "despesa", "🧾", ("irpf", "iptu", "ipva", "darf", "taxa")),
    FinancialCategory("Bancos e Tarifas", "#64748b", "despesa", "🏦", ("tarifa", "banco", "juros", "anuidade")),
    FinancialCategory("Seguros", "#0891b2", "despesa", "🛡️", ("seguro", "apolice")),
    FinancialCategory("Salário", "#22c55e", "receita", "💰", ("salario", "ordenado", "pagamento")),
    FinancialCategory("Freelance", "#10b981", "receita", "💼", ("freela", "consultoria")),
    FinancialCategory("Renda Extra", "#14b8a6", "receita", "💵", ("bonus", "comissao", "mesada", "presente")),
    FinancialCategory("Investimentos", "#3f51b5", "investimento", "📈", ("investimento", "dividendo", "rendimento")),
    FinancialCategory("Reembolso", "#2dd4bf", "receita", "↩️", ("estorno", "devolucao")),
    FinancialCategory("Outros", "#607d8b", "despesa", "💳", ("outro", "geral")),
)


def normalize_category_key(value: str) -> str:
    return (
        unicodedata.normalize("NFKD", value.strip().lower())
        .encode("ASCII", "ignore")
        .decode("ASCII")
    )


def resolve_default_category_name(value: str | None) -> str:
    if not value or not value.strip():
        return "Outros"
    normalized = normalize_category_key(value)
    for category in DEFAULT_FINANCIAL_CATEGORIES:
        if normalize_category_key(category.name) == normalized:
            return category.name
        if any(normalize_category_key(alias) == normalized for alias in category.aliases):
            return category.name
    for category in DEFAULT_FINANCIAL_CATEGORIES:
        if normalized in {normalize_category_key(alias) for alias in category.aliases}:
            return category.name
        if normalized in normalize_category_key(category.name):
            return category.name
    return value.strip().capitalize()


def category_color(name: str) -> str:
    resolved = resolve_default_category_name(name)
    for category in DEFAULT_FINANCIAL_CATEGORIES:
        if category.name == resolved:
            return category.color
    return "#1652F0"


def category_type(name: str) -> str:
    resolved = resolve_default_category_name(name)
    for category in DEFAULT_FINANCIAL_CATEGORIES:
        if category.name == resolved:
            return category.type
    return "despesa"


def category_emoji(name: str) -> str:
    resolved = resolve_default_category_name(name)
    for category in DEFAULT_FINANCIAL_CATEGORIES:
        if category.name == resolved:
            return category.emoji
    return "💳"


def default_category_names() -> list[str]:
    return [category.name for category in DEFAULT_FINANCIAL_CATEGORIES]
