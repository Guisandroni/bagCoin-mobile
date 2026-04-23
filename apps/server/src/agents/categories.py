from typing import List

CATEGORIES: List[str] = [
    "Alimentacao",
    "Restaurante",
    "Delivery",
    "Transporte",
    "Moradia",
    "Luz",
    "Agua",
    "Internet",
    "Telefone",
    "Saude",
    "Educacao",
    "Lazer",
    "Viagem",
    "Vestuario",
    "Beleza",
    "Tecnologia",
    "Assinaturas",
    "Pet",
    "Doacao",
    "Impostos",
    "Receita",
    "Outros",
]

CATEGORIES_TEXT = ", ".join(CATEGORIES)

CATEGORY_DESCRIPTIONS = {
    "Alimentacao": "mercado, supermercado, padaria, feira, hortifruti, lanches",
    "Restaurante": "restaurante, bar, cafeteria, pastelaria, lanchonete",
    "Delivery": "ifood, uber eats, rappi, delivery de comida",
    "Transporte": "uber, 99, gasolina, combustivel, onibus, metro, estacionamento, pedagio",
    "Moradia": "aluguel, condominio, financiamento, reforma, manutencao, material de construcao",
    "Luz": "energia eletrica, conta de luz",
    "Agua": "conta de agua, esgoto",
    "Internet": "wifi, banda larga, provedor",
    "Telefone": "celular, plano movel, recarga",
    "Saude": "farmacia, remedio, medico, dentista, plano de saude, exame, consulta, hospital, psicologo",
    "Educacao": "curso, livro, material escolar, faculdade, universidade, mensalidade, idioma",
    "Lazer": "cinema, teatro, show, festa, bar, hobby, streaming, musica",
    "Viagem": "passagem, hotel, hospedagem, passeio, turismo",
    "Vestuario": "roupa, calcado, acessorio, loja, moda",
    "Beleza": "salao, barbearia, manicure, estetica, cosmético, perfumaria",
    "Tecnologia": "eletronico, computador, celular, tablet, software, app, game, console",
    "Assinaturas": "netflix, spotify, youtube, gym, clube, revista, jornal, SaaS",
    "Pet": "racao, veterinario, petshop, remedio pet, banho e tosa",
    "Doacao": "caridade, igreja, ONG, vaquinha, pix de doacao",
    "Impostos": "IRPF, IPTU, IPVA, DARF, GPS, taxas governo",
    "Receita": "salario, freelance, renda extra, investimento, bonus, comissao, aluguel recebido",
    "Outros": "tudo que nao se encaixa nas categorias acima",
}

def get_category_prompt() -> str:
    lines = ["Choose the category EXACTLY from this list (case-insensitive):"]
    for cat, desc in CATEGORY_DESCRIPTIONS.items():
        lines.append(f"  - {cat}: {desc}")
    return "\n".join(lines)
