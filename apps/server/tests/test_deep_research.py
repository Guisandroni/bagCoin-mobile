import pytest
from unittest.mock import MagicMock, patch
from src.agents.nodes import research_node, recommendation_node
from src.models.user import User
from src.models.transaction import Transaction
from datetime import date

def test_research_node_captures_sources():
    """Test that research_node correctly extracts content and URLs from Tavily results."""
    # Mock search tool
    with patch("src.agents.nodes.search_tool") as mock_search:
        mock_search.invoke.return_value = [
            {"content": "Dica 1 de investimento", "url": "https://exemplo1.com"},
            {"content": "Dica 2 de economia", "url": "https://exemplo2.com"},
            {"content": "Dica 3 ignorada", "url": "https://exemplo3.com"}
        ]
        
        state = {
            "messages": [MagicMock(content="Onde investir hoje?")],
            "intent": "recommendation"
        }
        
        result = research_node(state)
        
        # Verify content summary
        assert "Dica 1" in result["query_result"]
        assert "Dica 2" in result["query_result"]
        
        # Verify sources list (should have top 2)
        assert len(result["sources"]) == 2
        assert result["sources"][0] == "https://exemplo1.com"
        assert result["sources"][1] == "https://exemplo2.com"

def test_recommendation_node_includes_sources_in_prompt():
    """Test that recommendation_node includes sources in the prompt sent to the LLM."""
    with patch("src.agents.nodes.llm") as mock_llm, \
         patch("src.agents.nodes.Session") as mock_session_class:
        
        mock_llm.invoke.return_value = MagicMock(content="Aqui estão dicas. Fontes consultadas: https://exemplo.com")
        mock_session = mock_session_class.return_value.__enter__.return_value
        mock_session.exec.return_value.all.return_value = [] # No transactions for simplicity
        
        state = {
            "user_id": 1,
            "whatsapp_number": "5527928341723@c.us",
            "query_result": "Contexto de mercado",
            "sources": ["https://exemplo.com", "https://outrosite.br"]
        }
        
        result = recommendation_node(state)
        
        # Verify the LLM was called
        mock_llm.invoke.assert_called_once()
        
        # Inspect the prompt sent to LLM (it should contain our instructions and links)
        # In langchain_groq, the call is invoke([SystemMessage, HumanMessage])
        call_args = mock_llm.invoke.call_args[0][0]
        human_message_content = call_args[1].content
        
        assert "https://exemplo.com" in human_message_content
        assert "https://outrosite.br" in human_message_content
        assert "Fontes consultadas:" in human_message_content
        assert "Aqui estão dicas" in result["messages"][0].content
