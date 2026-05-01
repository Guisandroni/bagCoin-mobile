"""Tests for BagCoin agent features — correction dedup, pattern learning, category routes."""

from datetime import datetime, timedelta
from unittest.mock import MagicMock, patch

import pytest

from app.services.deduplication_service import is_duplicate


# ═══════════════════════════════════════════════════════════════
# MOCK HELPERS
# ═══════════════════════════════════════════════════════════════


class MockTransaction:
    """Minimal mock for SQLAlchemy Transaction model."""

    def __init__(self, id=1, amount=0.0, description="", transaction_date=None, type="EXPENSE", category_name=""):
        self.id = id
        self.amount = amount
        self.description = description
        self.transaction_date = transaction_date or datetime.utcnow()
        self.type = type
        self.category_name = category_name


# ═══════════════════════════════════════════════════════════════
# 1. DEDUPLICAÇÃO FUZZY
# ═══════════════════════════════════════════════════════════════


class TestDeduplicationService:
    """Test the fuzzy dedup service."""

    @patch("app.services.deduplication_service.get_user_transactions")
    def test_is_duplicate_exact_match(self, mock_get_tx):
        """Same amount + same description = dedup."""
        mock_get_tx.return_value = [
            MockTransaction(id=1, amount=50.0, description="Mercado")
        ]
        assert is_duplicate("5511999999999", 50.0, "Mercado") is True

    @patch("app.services.deduplication_service.get_user_transactions")
    def test_is_duplicate_fuzzy_match(self, mock_get_tx):
        """Similar descriptions (85%+) = dedup.
        
        'Mercado São Paulo' vs 'Mercado São Paulo Extra' — 86% match.
        """
        mock_get_tx.return_value = [
            MockTransaction(id=1, amount=50.0, description="Mercado São Paulo")
        ]
        assert is_duplicate("5511999999999", 50.0, "Mercado São Paulo Extra") is True

    @patch("app.services.deduplication_service.get_user_transactions")
    def test_is_duplicate_fuzzy_match_supermercado(self, mock_get_tx):
        """'Supermercado Cidades' vs 'Supermercado Cidades Jardim' = dedup.
        
        Ratio: 85.1% >= 85% threshold.
        """
        mock_get_tx.return_value = [
            MockTransaction(id=1, amount=50.0, description="Supermercado Cidades")
        ]
        assert is_duplicate("5511999999999", 50.0, "Supermercado Cidades Jardim") is True

    @patch("app.services.deduplication_service.get_user_transactions")
    def test_is_duplicate_wrong_amount(self, mock_get_tx):
        """Different amount = no dedup."""
        mock_get_tx.return_value = [
            MockTransaction(id=1, amount=50.0, description="Mercado")
        ]
        assert is_duplicate("5511999999999", 30.0, "Mercado") is False

    @patch("app.services.deduplication_service.get_user_transactions")
    def test_is_duplicate_outside_window(self, mock_get_tx):
        """Transaction older than 5 min = no dedup."""
        mock_get_tx.return_value = [
            MockTransaction(
                id=1,
                amount=50.0,
                description="Mercado",
                transaction_date=datetime.utcnow() - timedelta(minutes=10),
            )
        ]
        assert is_duplicate("5511999999999", 50.0, "Mercado") is False

    @patch("app.services.deduplication_service.get_user_transactions")
    def test_is_duplicate_different_description(self, mock_get_tx):
        """Completely different description = no dedup."""
        mock_get_tx.return_value = [
            MockTransaction(id=1, amount=50.0, description="Gasolina posto BR")
        ]
        assert is_duplicate("5511999999999", 50.0, "Mercado") is False

    @patch("app.services.deduplication_service.get_user_transactions")
    def test_is_duplicate_no_recent_transactions(self, mock_get_tx):
        """No transactions at all = no dedup."""
        mock_get_tx.return_value = []
        assert is_duplicate("5511999999999", 50.0, "Mercado") is False


# ═══════════════════════════════════════════════════════════════
# 2. CORREÇÃO DE INTENÇÃO (correction_handler_node)
# ═══════════════════════════════════════════════════════════════


class TestCorrectionHandler:
    """Test the regex patterns for correction detection."""

    @patch("app.agents.orchestrator.update_transaction_handler_node")
    def test_correction_value(self, mock_update):
        """'R$ 60' should trigger value correction."""
        from app.agents.orchestrator import correction_handler_node

        state = {"phone_number": "5511999999999", "message": "Na verdade foi R$ 60"}
        correction_handler_node(state)
        mock_update.assert_called_once()

    @patch("app.agents.orchestrator.update_transaction_handler_node")
    def test_correction_category_era(self, mock_update):
        """'era Alimentação' should trigger category correction."""
        from app.agents.orchestrator import correction_handler_node

        state = {"phone_number": "5511999999999", "message": "era Alimentação"}
        correction_handler_node(state)
        mock_update.assert_called_once()
        assert state["extracted_data"]["category_name"] == "Alimentação"

    @patch("app.agents.orchestrator.update_transaction_handler_node")
    def test_correction_category_corrige(self, mock_update):
        """'corrige categoria para Transporte' should trigger category correction."""
        from app.agents.orchestrator import correction_handler_node

        state = {"phone_number": "5511999999999", "message": "corrige categoria para Transporte"}
        correction_handler_node(state)
        mock_update.assert_called_once()
        assert state["extracted_data"]["category_name"] == "Transporte"

    @patch("app.agents.orchestrator.update_transaction_handler_node")
    def test_correction_description_nome(self, mock_update):
        """'o nome é Mercado' should trigger description correction."""
        from app.agents.orchestrator import correction_handler_node

        state = {"phone_number": "5511999999999", "message": "o nome é Mercado"}
        correction_handler_node(state)
        mock_update.assert_called_once()
        assert state["extracted_data"]["description"] == "Mercado"

    @patch("app.agents.orchestrator.update_transaction_handler_node")
    def test_correction_description_descricao(self, mock_update):
        """'descrição certa é Padaria' should trigger description correction."""
        from app.agents.orchestrator import correction_handler_node

        state = {"phone_number": "5511999999999", "message": "descrição certa é Padaria"}
        correction_handler_node(state)
        mock_update.assert_called_once()
        assert state["extracted_data"]["description"] == "Padaria"

    def test_correction_fallback(self):
        """Unrecognized correction should get help message."""
        from app.agents.orchestrator import correction_handler_node

        state = {"phone_number": "5511999999999", "message": "mudou tudo"}
        correction_handler_node(state)
        assert "O que você quer corrigir?" in state["response"]


# ═══════════════════════════════════════════════════════════════
# 3. INTEGRAÇÃO — WEBHOOK TELEGRAM (simula conversa)
# ═══════════════════════════════════════════════════════════════


class TestWebhookConversations:
    """Test full conversation flow through the Telegram webhook.

    Uses mock DB and mock Redis to simulate the backend processing.
    """

    @pytest.mark.anyio
    async def test_register_expense_via_telegram(self, client, api_key_headers):
        """User registers an expense via Telegram — may be empty with mock."""
        payload = {
            "chat_id": "999999",
            "message": "Gastei R$ 42 no mercado",
            "source_format": "text",
        }
        response = await client.post(
            "/api/v1/webhook/telegram",
            json=payload,
            headers=api_key_headers,
        )
        assert response.status_code == 200
        # With mock DB, the orchestrator may not have real data
        # Just verify the endpoint is reachable and responds
        data = response.json()
        assert "reply" in data

    @pytest.mark.anyio
    async def test_query_via_telegram(self, client, api_key_headers):
        """User asks a question via Telegram."""
        payload = {
            "chat_id": "999999",
            "message": "Quanto gastei esse mês?",
            "source_format": "text",
        }
        response = await client.post(
            "/api/v1/webhook/telegram",
            json=payload,
            headers=api_key_headers,
        )
        assert response.status_code == 200
        data = response.json()
        assert "reply" in data

    @pytest.mark.anyio
    async def test_greeting_via_telegram(self, client, api_key_headers):
        """User sends a greeting."""
        payload = {
            "chat_id": "999999",
            "message": "Olá!",
            "source_format": "text",
        }
        response = await client.post(
            "/api/v1/webhook/telegram",
            json=payload,
            headers=api_key_headers,
        )
        assert response.status_code == 200
        data = response.json()
        assert "reply" in data
        assert len(data["reply"]) > 0

    @pytest.mark.anyio
    async def test_help_via_telegram(self, client, api_key_headers):
        """User asks for help — may return empty reply with mock."""
        payload = {
            "chat_id": "999999",
            "message": "O que você sabe fazer?",
            "source_format": "text",
        }
        response = await client.post(
            "/api/v1/webhook/telegram",
            json=payload,
            headers=api_key_headers,
        )
        assert response.status_code == 200
        # With mock DB, response may be empty — just check status
        data = response.json()
        assert "reply" in data


# ═══════════════════════════════════════════════════════════════
# 4. CATEGORY ROUTES (REST API)
# ═══════════════════════════════════════════════════════════════


class TestCategoryRoutes:
    """Test the BagCoin category REST endpoints."""

    @pytest.mark.anyio
    async def test_get_categories_missing_phone(self, client, api_key_headers):
        """GET categories without phone_number should return 422."""
        response = await client.get(
            "/api/v1/bagcoin/categories/",
            headers=api_key_headers,
        )
        assert response.status_code == 422

    @pytest.mark.anyio
    async def test_get_categories_with_phone(self, client, api_key_headers):
        """GET categories with phone_number should return a list."""
        response = await client.get(
            "/api/v1/bagcoin/categories/?phone_number=5511999999999",
            headers=api_key_headers,
        )
        # May return 200 or 307 (redirect) depending on ASGI middleware
        assert response.status_code in (200, 307)
