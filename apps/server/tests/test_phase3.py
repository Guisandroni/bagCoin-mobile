import pytest
from unittest.mock import MagicMock, patch
from langchain_core.messages import HumanMessage
from src.agents.nodes import report_node
from src.models import Transaction, User
from datetime import date

def test_report_node_generation():
    # Mock database session
    with patch("src.agents.nodes.Session") as mock_session_class:
        mock_session = mock_session_class.return_value.__enter__.return_value
        
        # Mock user
        mock_user = User(id=1, whatsapp_number="5527928341723@c.us", name="Test User")
        mock_session.get.return_value = mock_user
        
        # Mock transactions
        mock_transactions = [
            Transaction(id=1, user_id=1, amount=50.0, description="Pizza", category="Alimentação", transaction_date=date(2026, 4, 15)),
            Transaction(id=2, user_id=1, amount=100.0, description="Internet", category="Contas", transaction_date=date(2026, 4, 14)),
        ]
        mock_session.exec.return_value.all.return_value = mock_transactions
        
        # Mock report service
        with patch("src.agents.nodes.generate_financial_report") as mock_gen_report:
            mock_gen_report.return_value = b"fake_pdf_content"
            
            state = {
                "user_id": 1,
                "whatsapp_number": "5527928341723@c.us"
            }
            
            result = report_node(state)
            
            assert result["report_pdf_bytes"] == b"fake_pdf_content"
            assert result["messages"][0].content == "Relatório gerado com sucesso!"
            mock_gen_report.assert_called_once()

def test_report_node_no_transactions():
    with patch("src.agents.nodes.Session") as mock_session_class:
        mock_session = mock_session_class.return_value.__enter__.return_value
        mock_session.exec.return_value.all.return_value = []
        
        state = {
            "user_id": 1,
            "whatsapp_number": "5527928341723@c.us"
        }
        
        result = report_node(state)
        
        assert "Você não possui transações" in result["messages"][0].content
        assert "report_pdf_bytes" not in result
