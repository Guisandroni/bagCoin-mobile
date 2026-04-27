import pytest
from unittest.mock import MagicMock, patch
from datetime import datetime, timedelta
from langchain_core.messages import HumanMessage


# Fixtures para usuário mockado
@pytest.fixture
def mock_user():
    user = MagicMock()
    user.id = 1
    user.whatsapp_number = "5511999999999"
    user.name = "Teste"
    user.is_active = True
    user.activation_token_expires_at = datetime.utcnow() + timedelta(days=7)
    return user


@pytest.fixture
def mock_llm():
    with patch("src.agents.nodes.llm") as mock:
        yield mock


def test_router_node_unauthorized_new_user(mock_llm):
    """Usuário novo sem cadastro deve receber unauthorized"""
    with patch("src.agents.nodes.get_active_user", return_value=None):
        from src.agents.nodes import router_node
        state = {
            "messages": [HumanMessage(content="Oi")],
            "whatsapp_number": "5511888888888",
            "user_id": None,
        }
        result = router_node(state)
        assert result["intent"] == "unauthorized"


def test_router_node_auth_with_code(mock_llm):
    """Mensagem com código de ativação deve ir para auth"""
    with patch("src.agents.nodes.get_active_user", return_value=None):
        from src.agents.nodes import router_node
        state = {
            "messages": [HumanMessage(content="Activation code: ABC-123")],
            "whatsapp_number": "5511888888888",
            "user_id": None,
        }
        result = router_node(state)
        assert result["intent"] == "auth"


def test_router_node_awaiting_file_type(mock_llm, mock_user):
    """Se state indica que está aguardando tipo de arquivo, deve ir para file_type_confirmation"""
    with patch("src.agents.nodes.get_active_user", return_value=mock_user):
        from src.agents.nodes import router_node
        state = {
            "messages": [HumanMessage(content="extrato")],
            "whatsapp_number": "5511999999999",
            "user_id": 1,
            "awaiting_file_type": True,
            "pending_file_bytes": b"fake-pdf",
        }
        result = router_node(state)
        assert result["intent"] == "awaiting_file_type"
        assert result["user_id"] == 1


def test_router_node_file_upload_triggers_awaiting(mock_llm, mock_user):
    """Upload de PDF deve ativar awaiting_file_type"""
    with patch("src.agents.nodes.get_active_user", return_value=mock_user):
        from src.agents.nodes import router_node
        state = {
            "messages": [HumanMessage(content="[Anexo pdf]")],
            "whatsapp_number": "5511999999999",
            "user_id": 1,
            "file_type": "pdf",
            "file_bytes": b"fake-pdf",
        }
        result = router_node(state)
        assert result["intent"] == "pdf"
        assert result["awaiting_file_type"] is True
        assert result["pending_file_bytes"] == b"fake-pdf"


def test_file_type_confirmation_extrato(mock_user):
    """Usuário responde 'extrato' → processa como statement"""
    with patch("src.agents.nodes.get_active_user", return_value=mock_user):
        from src.agents.nodes import file_type_confirmation_node
        state = {
            "messages": [HumanMessage(content="é um extrato bancário")],
            "whatsapp_number": "5511999999999",
            "user_id": 1,
            "awaiting_file_type": True,
            "pending_file_bytes": b"fake-pdf",
            "pending_file_type": "pdf",
        }
        result = file_type_confirmation_node(state)
        assert result["intent"] == "statement"
        assert result["file_bytes"] == b"fake-pdf"
        assert result["awaiting_file_type"] is False


def test_file_type_confirmation_nota(mock_user):
    """Usuário responde 'nota fiscal' → processa como PDF/extraction"""
    with patch("src.agents.nodes.get_active_user", return_value=mock_user):
        from src.agents.nodes import file_type_confirmation_node
        state = {
            "messages": [HumanMessage(content="é uma nota fiscal")],
            "whatsapp_number": "5511999999999",
            "user_id": 1,
            "awaiting_file_type": True,
            "pending_file_bytes": b"fake-pdf",
            "pending_file_type": "pdf",
        }
        result = file_type_confirmation_node(state)
        assert result["intent"] == "pdf"
        assert result["file_bytes"] == b"fake-pdf"
        assert result["awaiting_file_type"] is False


def test_file_type_confirmation_unclear(mock_user):
    """Resposta não reconhecida deve pedir novamente"""
    with patch("src.agents.nodes.get_active_user", return_value=mock_user):
        from src.agents.nodes import file_type_confirmation_node
        state = {
            "messages": [HumanMessage(content="não sei")],
            "whatsapp_number": "5511999999999",
            "user_id": 1,
            "awaiting_file_type": True,
            "pending_file_bytes": b"fake-pdf",
            "pending_file_type": "pdf",
        }
        result = file_type_confirmation_node(state)
        assert "awaiting_file_type" in result
        assert result["awaiting_file_type"] is True
        assert "1\ufe0f\u20e3" in result["messages"][0].content


def test_auth_node_success(mock_llm):
    """Código válido deve ativar usuário e definir expiração em 7 dias"""
    mock_user = MagicMock()
    mock_user.is_active = False
    mock_user.name = "João"
    mock_user.activation_token = "ABC-123"
    mock_user.id = 99

    with patch("src.agents.nodes.Session") as MockSession:
        session = MockSession.return_value.__enter__.return_value
        session.exec.return_value.first.return_value = mock_user

        from src.agents.nodes import auth_node
        state = {
            "messages": [HumanMessage(content="Activation code: ABC-123")],
            "whatsapp_number": "5511999999999",
            "pushname": "João",
        }
        result = auth_node(state)

        assert result["user_id"] == 99
        assert mock_user.is_active is True
        assert mock_user.whatsapp_number == "5511999999999"
        assert mock_user.activation_token_expires_at is not None
        assert mock_user.activation_token_expires_at > datetime.utcnow() + timedelta(days=6)
        assert "Conexão estabelecida com sucesso" in result["messages"][0].content


def test_auth_node_already_active(mock_llm):
    """Código já ativado deve retornar erro"""
    mock_user = MagicMock()
    mock_user.is_active = True

    with patch("src.agents.nodes.Session") as MockSession:
        session = MockSession.return_value.__enter__.return_value
        session.exec.return_value.first.return_value = mock_user

        from src.agents.nodes import auth_node
        state = {
            "messages": [HumanMessage(content="Activation code: ABC-123")],
            "whatsapp_number": "5511999999999",
        }
        result = auth_node(state)
        assert "já foi utilizado" in result["messages"][0].content


def test_unauthorized_node_message():
    """Mensagem para não-autenticado deve conter instruções claras"""
    from src.agents.nodes import unauthorized_node
    state = {
        "messages": [HumanMessage(content="Oi")],
        "whatsapp_number": "5511999999999",
        "pushname": "Maria",
    }
    result = unauthorized_node(state)
    content = result["messages"][0].content
    assert "Assistente Financeiro Pessoal" in content
    assert "código de ativação" in content
    assert "7 dias" in content


def test_is_token_valid_active():
    """Token válido dentro do prazo"""
    from src.core.auth import is_token_valid
    user = MagicMock()
    user.is_active = True
    user.activation_token_expires_at = datetime.utcnow() + timedelta(days=1)
    assert is_token_valid(user) is True


def test_is_token_valid_expired():
    """Token expirado"""
    from src.core.auth import is_token_valid
    user = MagicMock()
    user.is_active = True
    user.activation_token_expires_at = datetime.utcnow() - timedelta(days=1)
    assert is_token_valid(user) is False


def test_is_token_valid_inactive():
    """Usuário inativo"""
    from src.core.auth import is_token_valid
    user = MagicMock()
    user.is_active = False
    assert is_token_valid(user) is False


def test_chat_node_help_request(mock_llm):
    """Pedido de ajuda deve ser respondido pelo chat_node"""
    mock_llm.invoke.return_value = MagicMock(content="Posso te ajudar! Envie 'Gastei 50 no mercado' para registrar.")
    from src.agents.nodes import chat_node
    state = {
        "messages": [HumanMessage(content="como funciona")],
        "user_id": 1,
    }
    result = chat_node(state)
    assert "Posso te ajudar" in result["messages"][0].content


def test_router_node_short_message_no_number(mock_llm, mock_user):
    """Mensagem curta sem número deve ser chat"""
    with patch("src.agents.nodes.get_active_user", return_value=mock_user):
        from src.agents.nodes import router_node
        state = {
            "messages": [HumanMessage(content="oi")],
            "whatsapp_number": "5511999999999",
            "user_id": 1,
        }
        result = router_node(state)
        assert result["intent"] == "chat"
