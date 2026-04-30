import logging
from typing import Dict, Any, List
from datetime import datetime
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.models import Transaction
from app.agents.statement_parser import parse_statement, detect_statement

logger = logging.getLogger(__name__)


def _map_category_to_db(category_name: str) -> str:
    """Mapeia nome de categoria heurística para o enum do banco de dados."""
    # Categorias válidas no banco (baseado no agent-finance)
    valid_categories = {
        "Alimentação": "ALIMENTACAO",
        "Transporte": "TRANSPORTE",
        "Moradia": "MORADIA",
        "Saúde": "SAUDE",
        "Educação": "EDUCACAO",
        "Entretenimento": "ENTRETENIMENTO",
        "Vestuário": "VESTUARIO",
        "Serviços": "SERVICOS",
        "Investimentos": "INVESTIMENTOS",
        "Renda": "RENDA",
        "Transferência": "TRANSFERENCIA",
        "Seguros": "SEGUROS",
        "Impostos": "IMPOSTOS",
        "Dívidas": "DIVIDAS",
        "Viagem": "VIAGEM",
        "Presentes": "PRESENTES",
        "Doações": "DOACOES",
        "Taxas Bancárias": "TAXAS_BANCARIAS",
        "Saque": "SAQUE",
        "Outros": "OUTROS",
    }
    return valid_categories.get(category_name, "OUTROS")


def import_transactions(state: Dict[str, Any]) -> Dict[str, Any]:
    """Importa transações de extrato bancário para o banco de dados.

    Espera que o estado contenha:
    - phone_number (para buscar/criar usuário)
    - context.media (com o extrato)

    Retorna:
    - state atualizado com response, import_summary, imported_count, error
    """
    from app.agents.persistence import get_or_create_user

    phone_number = state.get("phone_number")
    media = state.get("context", {}).get("media")
    error = state.get("error")

    if error:
        return state

    if not media:
        state["error"] = "Nenhuma mídia encontrada para importação"
        return state

    # Parse do extrato
    transactions = parse_statement(media)
    if not transactions:
        state["error"] = "Não consegui extrair transações do documento. Verifique se é um extrato bancário válido (CSV, OFX ou PDF)."
        return state

    logger.info(f"Importando {len(transactions)} transações de extrato para {phone_number}")

    try:
        db = next(get_db())
        user = get_or_create_user(phone_number, db)
        user_id = user.id

        imported = 0
        skipped = 0
        errors = []

        for tx in transactions:
            try:
                tx_date = datetime.strptime(tx["date"], "%Y-%m-%d")

                # Evita duplicatas por descrição + data + valor
                existing = db.query(Transaction).filter(
                    Transaction.user_id == user_id,
                    Transaction.transaction_date == tx_date,
                    Transaction.amount == tx["amount"],
                    Transaction.description == tx["description"]
                ).first()
                if existing:
                    skipped += 1
                    continue

                db_tx = Transaction(
                    user_id=user_id,
                    type=tx["type"].upper(),
                    amount=tx["amount"],
                    currency="BRL",
                    description=tx["description"],
                    transaction_date=tx_date,
                    source_format="statement_import",
                    raw_input=tx.get("raw", "")
                )
                db.add(db_tx)
                imported += 1
            except Exception as e:
                logger.warning(f"Erro ao importar transação {tx}: {e}")
                errors.append(str(e))
                continue

        db.commit()

        state["imported_count"] = imported
        state["skipped_count"] = skipped
        state["import_errors"] = errors
        state["intent"] = "import_statement"

        # Resumo amigável
        incomes = [t for t in transactions if t["type"] == "INCOME"]
        expenses = [t for t in transactions if t["type"] == "EXPENSE"]
        total_income = sum(t["amount"] for t in incomes)
        total_expense = sum(t["amount"] for t in expenses)

        state["import_summary"] = (
            f"📥 *Extrato Importado com Sucesso!*\n\n"
            f"✅ {imported} transações importadas\n"
            f"⏭️ {skipped} duplicatas ignoradas\n"
            f"💰 {len(incomes)} receitas (R$ {total_income:,.2f})\n"
            f"💸 {len(expenses)} despesas (R$ {total_expense:,.2f})\n"
        )
        if errors:
            state["import_summary"] += f"\n⚠️ {len(errors)} erros menores (ignorados)"

        logger.info(f"Importação concluída: {imported} importadas, {skipped} ignoradas")

    except Exception as e:
        logger.error(f"Erro na importação de extrato: {e}", exc_info=True)
        state["error"] = f"Erro ao importar extrato: {str(e)}"

    return state
