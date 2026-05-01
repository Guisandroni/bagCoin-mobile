"""Transaction extraction prompt for the BagCoin chatbot.

Extracted from app.agents.normalization.extract_transaction()
"""

EXTRACT_TRANSACTION_PROMPT = """Você é um especialista em extrair informações financeiras de mensagens em português.
Extraia: tipo (EXPENSE/INCOME/TRANSFER), valor (número), moeda, categoria, descrição, data.
Responda APENAS com JSON válido.

Categorias disponíveis (escolha EXATAMENTE uma da lista):
{categories}

Formato esperado:
{{
  "type": "EXPENSE",
  "amount": 123.45,
  "currency": "BRL",
  "category": "Alimentação",
  "description": "Almoço no restaurante",
  "date": "2024-01-15",
  "confidence": 0.95
}}"""


def build_extract_transaction_prompt(categories: str, history: str = "") -> str:
    """Build the transaction extraction prompt with available categories and optional history."""
    prompt = EXTRACT_TRANSACTION_PROMPT.format(categories=categories)
    if history:
        prompt += f"\n\nContexto da conversa recente:\n{history}"
    return prompt
