"""Normalization agent — extract structured transaction data from text.

Uses regex first, then LLM fallback for ambiguous cases.
"""
import logging
import re
import unicodedata
import time
from typing import Any
from datetime import datetime, date

from langchain_core.messages import HumanMessage, SystemMessage
from langchain_core.output_parsers import JsonOutputParser

from app.services.llm_service import get_llm, timed_invoke

logger = logging.getLogger(__name__)

# Categories and descriptions
CATEGORIES = [
    "Alimentação", "Restaurante", "Delivery", "Transporte", "Moradia",
    "Luz", "Água", "Internet", "Telefone", "Saúde", "Educação",
    "Lazer", "Viagem", "Vestuário", "Beleza", "Tecnologia",
    "Assinaturas", "Pet", "Doação", "Impostos", "Receita", "Outros",
]

CATEGORY_KEYWORDS = {
    "Alimentação": ["mercado", "supermercado", "padaria", "feira", "hortifruti", "lanches", "pao", "leite", "ovos", "arroz", "feijao"],
    "Restaurante": ["restaurante", "bar", "cafeteria", "pastelaria", "lanchonete", "almoco", "jantar", "pizza", "hamburguer", "lanche"],
    "Delivery": ["ifood", "uber eats", "rappi", "delivery"],
    "Transporte": ["uber", "99", "taxi", "gasolina", "combustivel", "onibus", "metro", "estacionamento", "pedagio", "passagem", "moto"],
    "Moradia": ["aluguel", "condominio", "financiamento", "reforma", "manutencao"],
    "Luz": ["energia", "eletricidade", "conta de luz"],
    "Água": ["agua", "conta de agua", "esgoto"],
    "Internet": ["internet", "wifi", "banda larga", "provedor", "fibra"],
    "Telefone": ["celular", "plano movel", "recarga", "tim", "vivo", "claro", "oi"],
    "Saúde": ["farmacia", "remedio", "medico", "dentista", "plano de saude", "exame", "consulta", "hospital", "psicologo"],
    "Educação": ["curso", "livro", "material escolar", "faculdade", "universidade", "mensalidade", "idioma"],
    "Lazer": ["cinema", "teatro", "show", "festa", "bar", "hobby", "streaming", "musica", "jogo"],
    "Viagem": ["passagem", "hotel", "hospedagem", "passeio", "turismo"],
    "Vestuário": ["roupa", "calcado", "acessorio", "loja", "moda", "shopping", "camiseta", "calca", "sapato"],
    "Beleza": ["salao", "barbearia", "manicure", "estetica", "cosmetico", "perfumaria"],
    "Tecnologia": ["eletronico", "computador", "tablet", "software", "app", "game", "console"],
    "Assinaturas": ["netflix", "spotify", "youtube premium", "gym", "clube", "revista", "jornal", "saas", "mensalidade"],
    "Pet": ["racao", "veterinario", "petshop", "remedio pet", "banho e tosa"],
    "Doação": ["caridade", "igreja", "ong", "vaquinha", "doacao"],
    "Impostos": ["irpf", "iptu", "ipva", "darf", "gps", "taxas governo"],
    "Receita": ["salario", "freelance", "renda extra", "investimento", "bonus", "comissao", "aluguel recebido", "mesada", "presente", "pai", "mae"],
}


def _parse_flexible_date(date_str: str) -> date | None:
    """Try to parse date in multiple formats."""
    if not date_str:
        return None
    formats = ["%Y-%m-%d", "%d/%m/%Y", "%Y/%m/%d", "%d-%m-%Y", "%m/%d/%Y"]
    for fmt in formats:
        try:
            return datetime.strptime(date_str, fmt).date()
        except ValueError:
            continue
    return None


def _suggest_category(text: str) -> str:
    """Suggest category based on keywords with unicode normalization."""
    def norm(s: str) -> str:
        return unicodedata.normalize("NFKD", s.lower()).encode("ASCII", "ignore").decode("ASCII")

    text_norm = norm(text)

    scores = {}
    for cat, words in CATEGORY_KEYWORDS.items():
        scores[cat] = sum(1 for word in words if word in text_norm)

    best = max(scores, key=scores.get)
    return best if scores[best] > 0 else "Outros"


def extract_transaction(state: dict[str, Any]) -> dict[str, Any]:
    """Extract financial information from user message.

    Strategy:
    1. Regex first (fast, <50ms)
    2. Keywords for category (fast)
    3. LLM only if regex failed or confidence is low
    """
    start_time = time.time()

    message = state.get("message", "")
    phone_number = state.get("phone_number", "")
    msg_lower = message.lower()

    extracted = {
        "type": "EXPENSE",
        "amount": None,
        "currency": "BRL",
        "category": None,
        "description": None,
        "date": None,
        "confidence": 0.5,
        "raw_text": message,
    }

    # 1. Regex for amount
    amount_match = re.search(r"R?\$\s*(\d{1,3}(?:[.,]\d{3})*[.,]\d{1,2}|\d+(?:[.,]\d{1,2})?)", message)
    if not amount_match:
        amount_match = re.search(r"(?:^|\s)(\d+(?:[.,]\d{1,2})?)(?:\s|$)", message)

    if amount_match:
        try:
            amount_str = amount_match.group(1).replace(".", "").replace(",", ".")
            if amount_str.count(".") > 1:
                parts = amount_str.split(".")
                amount_str = "".join(parts[:-1]) + "." + parts[-1]
            extracted["amount"] = float(amount_str)
            extracted["confidence"] = 0.8
        except ValueError:
            pass

    # 2. Type detection with context
    income_signals = ["recebi", "ganhei", "salário", "renda", "entrada", "pagamento recebido",
                      "me mandaram", "me mandou", "me enviaram", "depositaram", "caiu", "mesada", "aluguel recebido"]
    transfer_signals = ["transferi", "enviei", "mandei", "fiz pix", "passei para", "transferência"]

    if any(w in msg_lower for w in income_signals):
        extracted["type"] = "INCOME"
    elif any(w in msg_lower for w in transfer_signals):
        extracted["type"] = "TRANSFER"
    elif "pix" in msg_lower:
        if any(w in msg_lower for w in ["recebi", "me mandaram", "chegou", "depositaram"]):
            extracted["type"] = "INCOME"
        else:
            extracted["type"] = "EXPENSE"

    # 3. Extract description
    desc_patterns = [
        r"(?:gastei|paguei|comprei|gasto|despesa)\s+(?:R?\$\s*)?\d+(?:[.,]\d{1,2})?\s+(?:em|no|na|de)\s+(.+)$",
        r"(?:recebi|ganhei)\s+(?:R?\$\s*)?\d+(?:[.,]\d{1,2})?\s+(?:de|do|da)\s+(.+)$",
        r"^\d+(?:[.,]\d{1,2})?\s+(?:em|de|no|na)\s+(.+)$",
        r"^([a-zà-ú\s]+)\s+\d+(?:[.,]\d{1,2})?$",
    ]
    for pattern in desc_patterns:
        m = re.search(pattern, msg_lower, re.IGNORECASE)
        if m:
            extracted["description"] = m.group(1).strip().capitalize()
            break

    if not extracted["description"]:
        clean = re.sub(r"R?\$\s*\d+(?:[.,]\d{1,2})?", "", msg_lower)
        clean = re.sub(r"\b(gastei|paguei|comprei|recebi|ganhei|transferi|enviei|mandei|fiz|despesa|receita|pix|boleto)\b", "", clean)
        clean = clean.strip()
        if clean and len(clean) > 2:
            extracted["description"] = clean.capitalize()

    # 4. Extract date
    date_match = re.search(r"\b(\d{2}/\d{2}/\d{4}|\d{4}-\d{2}-\d{2}|\d{2}-\d{2}-\d{4})\b", message)
    if date_match:
        parsed = _parse_flexible_date(date_match.group(1))
        if parsed:
            extracted["date"] = parsed.strftime("%Y-%m-%d")

    # 5. Category by keywords (fast fallback)
    if not extracted["category"]:
        target_text = extracted["description"] or message
        extracted["category"] = _suggest_category(target_text)
        if extracted["category"] and extracted["category"] != "Outros":
            extracted["confidence"] = max(extracted["confidence"], 0.75)

    # 6. LLM only when needed (incomplete data or low confidence)
    needs_llm = (
        extracted["amount"] is None
        or extracted["category"] == "Outros"
        or extracted["confidence"] < 0.7
    )

    if needs_llm:
        try:
            llm = get_llm(temperature=0.1)
            if llm:
                history = ""
                try:
                    from app.agents.persistence import get_conversation_history
                    history = get_conversation_history(phone_number, limit=6)
                except Exception:
                    pass
                history_context = f"\n\nContexto da conversa recente:\n{history}" if history else ""

                system_prompt = f"""Você é um especialista em extrair informações financeiras de mensagens em português.
Extraia: tipo (EXPENSE/INCOME/TRANSFER), valor (número), moeda, categoria, descrição, data.
Responda APENAS com JSON válido.

Categorias disponíveis (escolha EXATAMENTE uma da lista):
{', '.join(CATEGORIES)}

Formato esperado:
{{
  "type": "EXPENSE",
  "amount": 123.45,
  "currency": "BRL",
  "category": "Alimentação",
  "description": "Almoço no restaurante",
  "date": "2024-01-15",
  "confidence": 0.95
}}{history_context}"""
                messages = [
                    SystemMessage(content=system_prompt),
                    HumanMessage(content=f"Mensagem: {message}"),
                ]
                response, latency_ms = timed_invoke(llm, messages, operation="extract_transaction")
                result = JsonOutputParser().parse(response.content)

                for key in ["type", "category", "description", "date"]:
                    if result.get(key):
                        extracted[key] = result[key]

                if result.get("amount") is not None:
                    extracted["amount"] = result["amount"]

                if result.get("confidence") is not None:
                    extracted["confidence"] = result["confidence"]
        except Exception as e:
            logger.warning(f"LLM refinement failed: {e}")

    elapsed = (time.time() - start_time) * 1000
    logger.info(
        f"[extract_transaction] {elapsed:.0f}ms | "
        f"amount={extracted['amount']} | category={extracted['category']} | "
        f"needs_llm={needs_llm}"
    )

    state["extracted_data"] = extracted
    return state
