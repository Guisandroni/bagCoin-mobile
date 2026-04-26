import pytest
from unittest.mock import MagicMock, patch
from langchain_core.messages import HumanMessage
from src.agents.nodes import router_node, extraction_node
from src.agents.state import AgentState, TransactionExtraction

@pytest.fixture
def mock_llm():
    with patch("src.agents.nodes.llm") as mock:
        yield mock

def test_router_node_record(mock_llm):
    # Mock response for "Gastei 50 no Ifood"
    mock_llm.invoke.return_value = MagicMock(content="record")

    with patch("src.agents.nodes.get_active_user") as mock_get_user:
        mock_user = MagicMock()
        mock_user.id = 1
        mock_user.is_active = True
        mock_get_user.return_value = mock_user

        state = {
            "messages": [HumanMessage(content="Gastei 50 no Ifood")],
            "whatsapp_number": "5511999999999",
        }
        result = router_node(state)

        assert result["intent"] == "record"

def test_router_node_query(mock_llm):
    # Mock response for "Quanto gastei?"
    mock_llm.invoke.return_value = MagicMock(content="query")

    with patch("src.agents.nodes.get_active_user") as mock_get_user:
        mock_user = MagicMock()
        mock_user.id = 1
        mock_user.is_active = True
        mock_get_user.return_value = mock_user

        state = {
            "messages": [HumanMessage(content="Quanto gastei?")],
            "whatsapp_number": "5511999999999",
        }
        result = router_node(state)

        assert result["intent"] == "query"

def test_extraction_node_mock(mock_llm):
    # Mock the with_structured_output result
    structured_mock = MagicMock()
    structured_mock.invoke.return_value = TransactionExtraction(
        amount=50.0,
        description="Ifood",
        category="Alimentação",
        date="2026-04-15"
    )
    mock_llm.with_structured_output.return_value = structured_mock

    # Mock DB interaction in extraction_node
    with patch("src.agents.nodes.Session"):
        state = {
            "messages": [HumanMessage(content="Gastei 50 no Ifood")],
            "whatsapp_number": "5511999999999",
            "user_id": 1,
        }
        result = extraction_node(state)

        assert result["extracted_data"].amount == 50.0
        assert "Registrado: R$ 50.00" in result["messages"][0].content
