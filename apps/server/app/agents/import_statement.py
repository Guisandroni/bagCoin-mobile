"""Import statement agent — imports bank statement transactions into the database.

Uses sync_session_maker for database operations.
"""

import logging
from datetime import datetime
from typing import Any

from app.agents.persistence import get_or_create_user
from app.agents.statement_parser import parse_statement
from app.db.models.category import Category
from app.db.models.transaction import Transaction
from app.db.session import sync_session_maker

logger = logging.getLogger(__name__)


def _map_category_to_db(category_name: str) -> str:
    """Mapeia nome de categoria heurística para as categorias padronizadas no banco.

    O statement_parser usa nomes como 'Renda', 'Entretenimento', 'Transferência'
    mas o banco usa categorias padronizadas como 'Receita', 'Lazer', 'Outros'.
    """
    mapping = {
        # Alimentação
        "Alimentação": "Alimentação",
        # Transporte
        "Transporte": "Transporte",
        # Moradia
        "Moradia": "Moradia",
        # Saúde
        "Saúde": "Saúde",
        "Saude": "Saúde",
        # Educação
        "Educação": "Educação",
        "Educacao": "Educação",
        # Entretenimento → Lazer (padronizado)
        "Entretenimento": "Lazer",
        "Lazer": "Lazer",
        # Vestuário
        "Vestuário": "Vestuário",
        "Vestuario": "Vestuário",
        # Renda → Receita (padronizado)
        "Renda": "Receita",
        "Receita": "Receita",
        # Investimentos → Outros (não é receita nem despesa direta)
        "Investimentos": "Outros",
        # Transferência → Outros
        "Transferência": "Outros",
        "Transferencia": "Outros",
        # Seguros
        "Seguros": "Outros",
        # Impostos
        "Impostos": "Impostos",
        # Viagem
        "Viagem": "Viagem",
        # Saque → Outros
        "Saque": "Outros",
        # Doações → Doação
        "Doações": "Doação",
        "Doacao": "Doação",
        "Doação": "Doação",
    }
    return mapping.get(category_name, "Outros")


def import_transactions(state: dict[str, Any]) -> dict[str, Any]:
    """Importa transações de extrato bancário para o banco de dados.

    Espera que o estado contenha:
    - phone_number (para buscar/criar usuário)
    - context.media (com o extrato)

    Retorna:
    - state atualizado com response, import_summary, imported_count, error
    """
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
        state["error"] = (
            "Não consegui extrair transações do documento. Verifique se é um extrato bancário válido (CSV, OFX ou PDF)."
        )
        return state

    logger.info(f"Importando {len(transactions)} transações de extrato para {phone_number}")

    db = sync_session_maker()
    try:
        user = get_or_create_user(phone_number, db)
        user_id = user.id

        imported = 0
        skipped = 0
        errors = []

        for tx in transactions:
            try:
                tx_date = datetime.strptime(tx["date"], "%Y-%m-%d")

                # Evita duplicatas por descrição + data + valor
                existing = (
                    db.query(Transaction)
                    .filter(
                        Transaction.user_id == user_id,
                        Transaction.transaction_date == tx_date,
                        Transaction.amount == tx["amount"],
                        Transaction.description == tx["description"],
                    )
                    .first()
                )
                if existing:
                    skipped += 1
                    continue

                # Busca ou cria a categoria para o usuário
                cat_name = _map_category_to_db(tx.get("category", "Outros"))
                category = (
                    db.query(Category)
                    .filter(Category.user_id == user_id, Category.name == cat_name)
                    .first()
                )
                if not category:
                    category = Category(
                        user_id=user_id,
                        name=cat_name,
                        is_default=(
                            cat_name
                            in [
                                "Alimentação",
                                "Transporte",
                                "Moradia",
                                "Lazer",
                                "Saúde",
                                "Educação",
                                "Outros",
                            ]
                        ),
                    )
                    db.add(category)
                    db.commit()
                    db.refresh(category)

                db_tx = Transaction(
                    user_id=user_id,
                    type=tx["type"].upper(),
                    amount=tx["amount"],
                    currency="BRL",
                    category_id=category.id,
                    description=tx["description"],
                    transaction_date=tx_date,
                    source_format="statement_import",
                    raw_input=tx.get("raw", ""),
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
            f"Extrato Importado com Sucesso!\n\n"
            f"{imported} transações importadas\n"
            f"{skipped} duplicatas ignoradas\n"
            f"{len(incomes)} receitas (R$ {total_income:,.2f})\n"
            f"{len(expenses)} despesas (R$ {total_expense:,.2f})\n"
        )
        if errors:
            state["import_summary"] += f"\n{len(errors)} erros menores (ignorados)"

        logger.info(f"Importação concluída: {imported} importadas, {skipped} ignoradas")

    except Exception as e:
        logger.error(f"Erro na importação de extrato: {e}", exc_info=True)
        state["error"] = f"Erro ao importar extrato: {e!s}"
    finally:
        db.close()

    return state
