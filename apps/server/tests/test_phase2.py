import pytest
from unittest.mock import MagicMock, patch, AsyncMock
from langchain_core.messages import HumanMessage, AIMessage
from src.agents.state import TransactionExtraction
from src.agents.nodes import router_node, audio_node, vision_node, document_node, extraction_node

@pytest.fixture
def mock_llm():
    with patch("src.agents.nodes.llm") as mock:
        yield mock

@pytest.fixture
def mock_vision_llm():
    with patch("src.agents.nodes.vision_llm") as mock:
        yield mock

@pytest.fixture
def mock_groq_client():
    with patch("src.agents.nodes.groq_client") as mock:
        yield mock

# --- Test Router Node ---
def test_router_node_attachments(mock_llm):
    # Test Audio routing
    state = {"file_type": "audio", "messages": [HumanMessage(content="[Audio]")]}
    assert router_node(state)["intent"] == "audio"
    
    # Test Image routing
    state = {"file_type": "image", "messages": [HumanMessage(content="[Image]")]}
    assert router_node(state)["intent"] == "image"
    
    # Test PDF routing
    state = {"file_type": "pdf", "messages": [HumanMessage(content="[PDF]")]}
    assert router_node(state)["intent"] == "pdf"

# --- Test Audio Node ---
def test_audio_node_transcription(mock_groq_client):
    mock_groq_client.audio.transcriptions.create.return_value = "Gastei 50 reais em pizza"
    
    state = {"file_bytes": b"fake_audio_bytes", "file_type": "audio"}
    result = audio_node(state)
    
    assert result["intent"] == "record"
    assert result["messages"][0].content == "Gastei 50 reais em pizza"

# --- Test Vision Node ---
def test_vision_node_ocr(mock_vision_llm):
    mock_vision_llm.invoke.return_value = MagicMock(content="Receipt for Pizza: R$ 50.00")
    
    state = {"file_bytes": b"fake_image_bytes", "file_type": "image"}
    result = vision_node(state)
    
    assert result["intent"] == "record"
    assert "OCR Result: Receipt for Pizza" in result["messages"][0].content

# --- Test Document Node ---
def test_document_node_pdf():
    # We need a real minimal PDF for pdfplumber or mock pdfplumber
    with patch("pdfplumber.open") as mock_pdf:
        mock_page = MagicMock()
        mock_page.extract_text.return_value = "Invoice Total: 100.00"
        mock_pdf.return_value.__enter__.return_value.pages = [mock_page]
        
        state = {"file_bytes": b"fake_pdf_bytes", "file_type": "pdf"}
        result = document_node(state)
        
        assert "Extracted from PDF: Invoice Total: 100.00" in result["messages"][0].content
        assert result["intent"] == "record"

# --- Test Extraction Node Integration ---
def test_extraction_node_after_ocr(mock_llm):
    # Mock the structured output for extraction
    structured_mock = MagicMock()
    structured_mock.invoke.return_value = TransactionExtraction(
        amount=50.0,
        description="Pizza Hut",
        category="Alimentação",
        date="2026-04-15"
    )
    mock_llm.with_structured_output.return_value = structured_mock
    
    with patch("src.agents.nodes.Session"), patch("src.agents.nodes.get_or_create_user") as mock_user:
        mock_user.return_value = 1
        # State simulating message coming from vision_node
        state = {
            "messages": [HumanMessage(content="OCR Result: Receipt for Pizza: R$ 50.00")],
            "whatsapp_number": "5527928341723@c.us"
        }
        result = extraction_node(state)
        
        assert result["extracted_data"].amount == 50.0
        assert "Registrado: R$ 50.00" in result["messages"][0].content
