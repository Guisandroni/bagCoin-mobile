from typing import List

CATEGORIES: List[str] = [
    "Alimentacao",
    "Transporte",
    "Moradia",
    "Saude",
    "Educacao",
    "Lazer",
    "Vestuario",
    "Tecnologia",
    "Receita",
    "Outros",
]

CATEGORIES_TEXT = ", ".join(CATEGORIES)

CATEGORY_DESCRIPTIONS = {
    "Alimentacao": "mercado, restaurante, delivery, lanches, padaria",
    "Transporte": "uber, gasolina, onibus, estacionamento, metro",
    "Moradia": "aluguel, condominio, luz, agua, internet, telefone",
    "Saude": "farmacia, medico, dentista, plano de saude, exame",
    "Educacao": "curso, livro, material escolar, faculdade",
    "Lazer": "cinema, viagem, bar, hobby, assinatura, streaming",
    "Vestuario": "roupa, calcado, acessorio, loja",
    "Tecnologia": "eletronico, software, app, celular, computador",
    "Receita": "salario, freelance, renda extra, investimento, bonus",
    "Outros": "tudo que nao se encaixa nas categorias acima",
}

def get_category_prompt() -> str:
    lines = ["Choose the category EXACTLY from this list (case-insensitive):"]
    for cat, desc in CATEGORY_DESCRIPTIONS.items():
        lines.append(f"  - {cat}: {desc}")
    return "\n".join(lines)
