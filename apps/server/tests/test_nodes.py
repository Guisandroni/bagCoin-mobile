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
    
    state = {"messages": [HumanMessage(content="Gastei 50 no Ifood")]}
    result = router_node(state)
    
    assert result["intent"] == "record"

def test_router_node_query(mock_llm):
    # Mock response for "Quanto gastei?"
    mock_llm.invoke.return_value = MagicMock(content="query")
    
    state = {"messages": [HumanMessage(content="Quanto gastei?")]}
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
    with patch("src.agents.nodes.Session"), patch("src.agents.nodes.get_or_create_user") as mock_user:
        mock_user.return_value = 1
        state = {
            "messages": [HumanMessage(content="Gastei 50 no Ifood")],
            "whatsapp_number": "5527928341723"
        }
        result = extraction_node(state)
        
        assert result["extracted_data"].amount == 50.0
        assert "Registrado: R$ 50.00" in result["messages"][0].content
