import pytest
from unittest.mock import MagicMock, patch
from src.agents.nodes import research_node, recommendation_node
from src.models.user import User
from src.models.transaction import Transaction
from datetime import date

def test_research_node_mock():
    # Mock search tool
    with patch("src.agents.nodes.search_tool") as mock_search:
        mock_search.invoke.return_value = [{"content": "Invest in Treasury Direct (Tesouro Direto) for stability."}]
        
        state = {
            "messages": [MagicMock(content="Onde investir 100 reais?")],
            "intent": "recommendation"
        }
        
        result = research_node(state)
        assert "Tesouro Direto" in result["query_result"]

def test_recommendation_node_logic():
    # Mock LLM and Session
    with patch("src.agents.nodes.llm") as mock_llm, \
         patch("src.agents.nodes.Session") as mock_session_class:
        
        mock_llm.invoke.return_value = MagicMock(content="Recomendação: Guarde dinheiro na poupança.")
        mock_session = mock_session_class.return_value.__enter__.return_value
        
        # Mock transactions to give context to recommendation
        mock_transactions = [
            Transaction(id=1, user_id=1, amount=100.0, description="Pizza", category="Alimentação", transaction_date=date.today())
        ]
        mock_session.exec.return_value.all.return_value = mock_transactions
        
        state = {
            "user_id": 1,
            "whatsapp_number": "5527928341723@c.us",
            "query_result": "Stable market context"
        }
        
        result = recommendation_node(state)
        assert "Recomendação" in result["messages"][0].content
        mock_llm.invoke.assert_called_once()
