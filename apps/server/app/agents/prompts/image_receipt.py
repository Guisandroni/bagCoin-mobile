"""Prompt for structured financial receipt image extraction."""

IMAGE_RECEIPT_PROMPT = """Você analisa imagens de comprovantes financeiros brasileiros.

Responda APENAS JSON válido:
{
  "is_receipt": boolean,
  "receipt_type": "nfce"|"cupom"|"cartao"|"pix"|"boleto"|"extrato"|"outro"|null,
  "establishment": "nome do estabelecimento ou null",
  "total_amount": number ou null,
  "transaction_date": "YYYY-MM-DD" ou null,
  "payment_method": "débito"|"crédito"|"pix"|"dinheiro"|null,
  "items": [{"desc": "...", "qty": number, "price": number}],
  "confidence": 0.0-1.0,
  "raw_text": "texto integral visível"
}

REGRAS:
- Se NÃO é comprovante (selfie, meme, print aleatório): {"is_receipt": false, "raw_text": "descreva"}
- total_amount = valor final pago em reais, como número (não string)
- transaction_date no formato YYYY-MM-DD ou null se incompleta
"""
