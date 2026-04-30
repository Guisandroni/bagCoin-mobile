import logging
import json
from typing import Dict, Any, List
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from langchain_core.messages import HumanMessage, SystemMessage
from app.services.llm_service import get_llm
from app.database import SessionLocal
from app.models.models import User, Transaction, Category
from app.agents.persistence import get_or_create_user
from app.agents.text_to_sql import execute_sql_query

logger = logging.getLogger(__name__)

def get_user_financial_summary(phone_number: str) -> Dict[str, Any]:
    """Obtém resumo financeiro do usuário para análise."""
    db = SessionLocal()
    try:
        user = get_or_create_user(phone_number, db)
        
        # Últimos 30 dias
        thirty_days_ago = datetime.utcnow() - timedelta(days=30)
        
        expenses_sql = """
            SELECT COALESCE(SUM(amount), 0) as total 
            FROM transactions 
            WHERE user_id = (SELECT id FROM users WHERE phone_number = :phone) 
            AND type = 'expense' 
            AND transaction_date >= :date
        """
        income_sql = """
            SELECT COALESCE(SUM(amount), 0) as total 
            FROM transactions 
            WHERE user_id = (SELECT id FROM users WHERE phone_number = :phone) 
            AND type = 'income' 
            AND transaction_date >= :date
        """
        
        expenses = execute_sql_query(expenses_sql, {"phone": phone_number, "date": thirty_days_ago})
        income = execute_sql_query(income_sql, {"phone": phone_number, "date": thirty_days_ago})
        
        total_expense = expenses[0]["total"] if expenses else 0
        total_income = income[0]["total"] if income else 0
        
        # Top categorias
        cat_sql = """
            SELECT c.name, SUM(t.amount) as total
            FROM transactions t
            JOIN categories c ON t.category_id = c.id
            WHERE t.user_id = (SELECT id FROM users WHERE phone_number = :phone)
            AND t.type = 'expense'
            AND t.transaction_date >= :date
            GROUP BY c.name
            ORDER BY total DESC
            LIMIT 5
        """
        top_categories = execute_sql_query(cat_sql, {"phone": phone_number, "date": thirty_days_ago})
        
        # Contagem de transações
        count_sql = """
            SELECT COUNT(*) as count FROM transactions 
            WHERE user_id = (SELECT id FROM users WHERE phone_number = :phone)
            AND transaction_date >= :date
        """
        tx_count = execute_sql_query(count_sql, {"phone": phone_number, "date": thirty_days_ago})
        
        return {
            "total_income_30d": total_income,
            "total_expense_30d": total_expense,
            "balance_30d": total_income - total_expense,
            "top_expense_categories": top_categories,
            "transaction_count_30d": tx_count[0]["count"] if tx_count else 0,
            "user_profile": user.financial_profile or {}
        }
    finally:
        db.close()

def generate_recommendations(state: Dict[str, Any]) -> Dict[str, Any]:
    """Gera recomendações financeiras personalizadas."""
    phone_number = state.get("phone_number", "")
    llm = get_llm(temperature=0.7)
    
    # Obtém dados financeiros
    summary = get_user_financial_summary(phone_number)
    
    if summary["transaction_count_30d"] == 0:
        state["response"] = (
            "🤖 *Recomendações Financeiras*\n\n"
            "Ainda não tenho dados suficientes para gerar recomendações personalizadas.\n\n"
            "💡 *Dica inicial:* Comece registrando seus gastos diários. "
            "Com cerca de 1-2 semanas de dados, já consigo identificar padrões e sugerir melhorias!"
        )
        return state
    
    if not llm:
        # Recomendações básicas sem LLM
        recommendations = []

        if summary["balance_30d"] < 0:
            recommendations.append("⚠️ Seus gastos superaram suas receitas nos últimos 30 dias. Tente reduzir despesas não essenciais.")
        elif summary["balance_30d"] > 0:
            recommendations.append(f"✅ Você teve uma sobra de R$ {summary['balance_30d']:,.2f}. Considere guardar parte em uma reserva de emergência.")

        if summary["top_expense_categories"]:
            top_cat = summary["top_expense_categories"][0]
            recommendations.append(f"📊 Sua maior categoria de gasto é *{top_cat['name']}* (R$ {top_cat['total']:,.2f}). Avalie se está alinhada com suas prioridades.")

        state["response"] = "🤖 *Recomendações Financeiras*\n\n" + "\n\n".join(recommendations)
        return state

    # Injeta histórico da conversa para recomendações contextuais
    from app.agents.persistence import get_conversation_history
    history = get_conversation_history(phone_number, limit=6)
    history_context = f"\n\nÚltimas mensagens da conversa:\n{history}" if history else ""

    system_prompt = """Você é um assistente financeiro educativo e cauteloso.
Analise os dados financeiros do usuário e forneça recomendações personalizadas.

IMPORTANTE:
- NÃO prometa rentabilidade ou retorno de investimentos
- NÃO substitua consultoria financeira profissional
- Use tom educativo e informativo
- Baseie-se apenas nos dados fornecidos
- Sugira ações práticas e realistas
- Mencione a importância de reserva de emergência
- Formate a resposta de forma amigável para WhatsApp (use emojis e quebras de linha)
"""
    
    context = json.dumps(summary, ensure_ascii=False, indent=2)
    
    try:
        messages = [
            SystemMessage(content=system_prompt),
            HumanMessage(content=f"Dados financeiros do usuário (últimos 30 dias):\n{context}\n\n{history_context if history_context else ''}\n\nGere recomendações personalizadas baseadas nos dados e no contexto da conversa.")
        ]
        
        response = llm.invoke(messages)
        
        state["response"] = f"🤖 *Recomendações Financeiras*\n\n{response.content}\n\n_Disclaimer: Estas são sugestões educativas e não substituem consultoria financeira profissional._"
        
    except Exception as e:
        logger.error(f"Erro ao gerar recomendações: {e}")
        state["error"] = "Não consegui gerar recomendações no momento. Tente novamente mais tarde."
    
    return state
