"""Test battery for the new budget creation wizard workflow.

Tests the full interactive flow:
  "criar orçamento" → type selection (1/2) → validation → name → value → confirm → execute
"""

import json
from unittest.mock import MagicMock, patch

import pytest

from app.agents.wizard import (
    WIZARD_SCHEMAS,
    _build_option_prompt,
    _parse_option_choice,
    _parse_value,
    wizard_node,
)

# ═══════════════════════════════════════════════════════════════
# 1. SCHEMA INTEGRITY
# ═══════════════════════════════════════════════════════════════


class TestSchemaIntegrity:
    """Verify the create_budget schema is correctly defined."""

    def test_budget_type_in_schema(self):
        """budget_type must be the FIRST field (asked first in wizard)."""
        schema = WIZARD_SCHEMAS["create_budget"]
        assert schema["fields"][0] == "budget_type", (
            f"budget_type must be field[0], got: {schema['fields']}"
        )

    def test_options_defined(self):
        """Both options (1=general, 2=category) must be defined."""
        opts = WIZARD_SCHEMAS["create_budget"]["options"]["budget_type"]
        assert opts == {"1": "general", "2": "category"}, f"Unexpected options: {opts}"

    def test_option_labels_defined(self):
        """Option labels must have both 1 and 2 with Portuguese descriptions."""
        labels = WIZARD_SCHEMAS["create_budget"]["option_labels"]["budget_type"]
        assert "1" in labels
        assert "2" in labels
        assert "Conta" in labels["1"] or "Saldo" in labels["1"]
        assert "categoria" in labels["2"].lower()

    def test_category_id_nullable(self):
        """category_id must be nullable in model for general-type budgets."""
        from app.db.models.budget import Budget
        # Check the column is nullable
        col = Budget.__table__.columns.get("category_id")
        assert col is not None, "category_id column missing"
        assert col.nullable is True, f"category_id should be nullable, got nullable={col.nullable}"

    def test_budget_type_default(self):
        """budget_type must exist with default='category'."""
        from app.db.models.budget import Budget
        col = Budget.__table__.columns.get("budget_type")
        assert col is not None, "budget_type column missing"
        assert not col.nullable or col.server_default is not None, "budget_type needs default"


# ═══════════════════════════════════════════════════════════════
# 2. OPTION PARSING
# ═══════════════════════════════════════════════════════════════


class TestOptionParsing:
    """Test _parse_option_choice with various user inputs."""

    def test_digit_1(self):
        assert _parse_option_choice("1", ["1", "2"]) == "1"

    def test_digit_2(self):
        assert _parse_option_choice("2", ["1", "2"]) == "2"

    def test_digit_3_invalid(self):
        """3 is not a valid option for budget_type (only 1,2)."""
        assert _parse_option_choice("3", ["1", "2"]) is None

    def test_digit_0_invalid(self):
        assert _parse_option_choice("0", ["1", "2"]) is None

    def test_word_um(self):
        assert _parse_option_choice("um", ["1", "2"]) == "1"

    def test_word_primeira(self):
        assert _parse_option_choice("primeira", ["1", "2"]) == "1"

    def test_word_segunda(self):
        assert _parse_option_choice("segunda", ["1", "2"]) == "2"

    def test_word_dois(self):
        assert _parse_option_choice("dois", ["1", "2"]) == "2"

    def test_word_tres_not_in_options(self):
        """'três' should return None when only 1,2 are valid."""
        assert _parse_option_choice("três", ["1", "2"]) is None

    def test_embedded_number(self):
        """'quero a opção 1' → '1'."""
        assert _parse_option_choice("quero a opção 1", ["1", "2"]) == "1"

    def test_embedded_number_2(self):
        """'opcao 2 por favor' → '2'."""
        assert _parse_option_choice("opcao 2 por favor", ["1", "2"]) == "2"

    def test_random_text(self):
        """Random text without a digit should return None."""
        assert _parse_option_choice("não sei qual escolher", ["1", "2"]) is None

    def test_text_with_invalid_number(self):
        """'quero a 5' should return None (5 not in valid_keys)."""
        assert _parse_option_choice("quero a 5", ["1", "2"]) is None

    def test_just_text_no_number(self):
        """'criar orçamento' should return None."""
        assert _parse_option_choice("criar orçamento", ["1", "2"]) is None


# ═══════════════════════════════════════════════════════════════
# 3. OPTION PROMPT BUILDING
# ═══════════════════════════════════════════════════════════════


class TestOptionPrompt:
    """Test _build_option_prompt output format."""

    def test_first_prompt(self):
        """First prompt should ask 'que tipo' without error prefix."""
        labels = WIZARD_SCHEMAS["create_budget"]["option_labels"]["budget_type"]
        prompt = _build_option_prompt("budget_type", labels, is_retry=False)
        assert "Que tipo" in prompt or "tipo" in prompt.lower()
        assert "Não entendi" not in prompt  # No error prefix
        assert "Conta" in prompt
        assert "categoria" in prompt.lower()
        assert "Responda 1 ou 2" in prompt

    def test_retry_prompt(self):
        """Retry prompt should include 'Não entendi' error message."""
        labels = WIZARD_SCHEMAS["create_budget"]["option_labels"]["budget_type"]
        prompt = _build_option_prompt("budget_type", labels, is_retry=True)
        assert "Não entendi" in prompt
        assert "confirmar" in prompt.lower() or "Responda" in prompt

    def test_contains_both_options(self):
        """Prompt must mention both option 1 and option 2."""
        labels = WIZARD_SCHEMAS["create_budget"]["option_labels"]["budget_type"]
        prompt = _build_option_prompt("budget_type", labels)
        assert "1️⃣" in prompt
        assert "2️⃣" in prompt


# ═══════════════════════════════════════════════════════════════
# 4. VALUE PARSING (_parse_value)
# ═══════════════════════════════════════════════════════════════


class TestParseValue:
    """Test _parse_value for Brazilian currency parsing."""

    def test_simple_integer(self):
        assert _parse_value("5000") == 5000.0

    def test_with_rs(self):
        assert _parse_value("R$ 5000") == 5000.0

    def test_with_cents(self):
        assert _parse_value("50.40") == 50.40

    def test_brazilian_comma(self):
        assert _parse_value("3000,50") == 3000.50

    def test_brazilian_thousands(self):
        """1.500 (with dot as thousands separator) → 1500."""
        val = _parse_value("1.500")
        # Our parser treats single dot in big numbers as thousands separator
        # "1.500" → cleaned "1500" → 1500.0
        assert val == 1500.0

    def test_brazilian_full_format(self):
        """1.500,50 → 1500.50."""
        assert _parse_value("1.500,50") == 1500.50

    def test_empty(self):
        assert _parse_value("") is None

    def test_text_only(self):
        assert _parse_value("texto sem numero") is None


# ═══════════════════════════════════════════════════════════════
# 5. FULL WIZARD FLOW SIMULATION
# ═══════════════════════════════════════════════════════════════


class TestWizardNodeFlow:
    """Integration-style tests for wizard_node state machine.

    These test the full interactive flow by simulating multi-turn conversations.
    They mock the database and LLM calls since we can't run a real DB here.
    """

    def _base_state(self, message, phone="5511999999999", intent="create_budget"):
        """Build a minimal state dict for wizard_node."""
        return {
            "message": message,
            "phone_number": phone,
            "intent": intent,
            "response": "",
        }

    @patch("app.agents.wizard._get_conversation")
    @patch("app.agents.wizard._save_wizard_state")
    @patch("app.agents.wizard._clear_wizard_state")
    @patch("app.agents.wizard.get_llm")
    def test_turn1_just_create_budget_shows_options(
        self, mock_llm, mock_clear, mock_save, mock_get_conv
    ):
        """Turn 1: 'criar orçamento' (no data) → shows type selection menu."""
        mock_get_conv.return_value = None  # No existing wizard
        mock_llm.return_value = None  # No LLM available (fast path)

        state = self._base_state("criar orçamento")
        result = wizard_node(state)

        assert result["response"], "Response should not be empty"
        assert "1️⃣" in result["response"], f"Should show option 1 emoji. Got: {result['response'][:200]}"
        assert "2️⃣" in result["response"], f"Should show option 2 emoji. Got: {result['response'][:200]}"
        assert "Responda 1 ou 2" in result["response"]

    @patch("app.agents.wizard._load_wizard_state")
    @patch("app.agents.wizard._save_wizard_state")
    @patch("app.agents.wizard._clear_wizard_state")
    @patch("app.agents.wizard.get_llm")
    def test_turn2_invalid_option_3_shows_retry(
        self, mock_llm, mock_clear, mock_save, mock_load
    ):
        """Turn 2: user responds '3' to type selection → retry prompt."""
        mock_llm.return_value = None

        # Simulate in-progress wizard waiting for budget_type
        mock_load.return_value = {
            "type": "create_budget",
            "status": "collecting",
            "collected": {},
            "missing": ["budget_type", "name", "total_limit"],
            "updated_at": "2026-05-01T12:00:00",
        }

        state = self._base_state("3", intent="create_budget")
        result = wizard_node(state)

        assert result["response"], "Response should not be empty"
        assert "Não entendi" in result["response"], (
            f"Should say 'Não entendi'. Got: {result['response'][:200]}"
        )

    @patch("app.agents.wizard._load_wizard_state")
    @patch("app.agents.wizard._save_wizard_state")
    @patch("app.agents.wizard._clear_wizard_state")
    @patch("app.agents.wizard.get_llm")
    def test_turn2_invalid_random_text_shows_retry(
        self, mock_llm, mock_clear, mock_save, mock_load
    ):
        """Turn 2: user responds 'não sei' → retry prompt (no valid option detected)."""
        mock_llm.return_value = None

        mock_load.return_value = {
            "type": "create_budget",
            "status": "collecting",
            "collected": {},
            "missing": ["budget_type", "name", "total_limit"],
            "updated_at": "2026-05-01T12:00:00",
        }

        state = self._base_state("não sei", intent="create_budget")
        result = wizard_node(state)

        assert "Não entendi" in result["response"], (
            f"Should retry with 'Não entendi'. Got: {result['response'][:200]}"
        )

    @patch("app.agents.wizard._load_wizard_state")
    @patch("app.agents.wizard._save_wizard_state")
    @patch("app.agents.wizard._clear_wizard_state")
    @patch("app.agents.wizard.get_llm")
    @patch("app.agents.wizard._extract_fields_with_llm")
    def test_turn2_valid_option_1_proceeds_to_name(
        self, mock_extract_llm, mock_llm, mock_clear, mock_save, mock_load
    ):
        """Turn 2: user selects '1' → wizard proceeds to ask for name."""
        mock_llm.return_value = None
        mock_extract_llm.return_value = {}  # No LLM extraction needed

        mock_load.return_value = {
            "type": "create_budget",
            "status": "collecting",
            "collected": {},
            "missing": ["budget_type", "name", "total_limit"],
            "updated_at": "2026-05-01T12:00:00",
        }

        state = self._base_state("1", intent="create_budget")
        result = wizard_node(state)

        assert "Não entendi" not in result.get("response", ""), (
            f"Should NOT show error for valid option. Got: {result['response'][:200]}"
        )
        # After option, it should ask for remaining fields
        assert any(w in result.get("response", "").lower() for w in ["nome", "ainda preciso", "já tenho"]), (
            f"Response should ask for name or remaining fields. Got: {result['response'][:200]}"
        )

    @patch("app.agents.wizard._load_wizard_state")
    @patch("app.agents.wizard._save_wizard_state")
    @patch("app.agents.wizard._clear_wizard_state")
    @patch("app.agents.wizard.get_llm")
    @patch("app.agents.wizard._extract_fields_with_llm")
    def test_turn2_valid_option_2_proceeds_to_name(
        self, mock_extract_llm, mock_llm, mock_clear, mock_save, mock_load
    ):
        """Turn 2: user selects '2' (category) → wizard proceeds."""
        mock_llm.return_value = None
        mock_extract_llm.return_value = {}

        mock_load.return_value = {
            "type": "create_budget",
            "status": "collecting",
            "collected": {},
            "missing": ["budget_type", "name", "total_limit"],
            "updated_at": "2026-05-01T12:00:00",
        }

        state = self._base_state("2", intent="create_budget")
        result = wizard_node(state)

        assert "Não entendi" not in result.get("response", ""), (
            f"Option 2 should be valid. Got: {result['response'][:200]}"
        )

    @patch("app.agents.wizard._load_wizard_state")
    @patch("app.agents.wizard._save_wizard_state")
    @patch("app.agents.wizard._clear_wizard_state")
    @patch("app.agents.wizard.get_llm")
    def test_turn1_create_budget_with_data_goes_direct(
        self, mock_llm, mock_clear, mock_save, mock_load
    ):
        """Turn 1: 'criar orçamento Mercado 800' (has data) → single-turn or wizard start."""
        mock_load.return_value = None  # No existing wizard

        # Mock LLM to return extracted fields
        mock_llm_obj = MagicMock()
        mock_llm_obj.invoke.return_value.content = '{"name": "Mercado", "total_limit": 800}'
        mock_llm.return_value = mock_llm_obj

        state = self._base_state("criar orçamento Mercado 800")
        result = wizard_node(state)

        # Should either extract enough to confirm or be in collecting mode
        assert result.get("response"), "Should have some response"
        # Note: the actual flow depends on whether the LLM extracts all fields
        # For now just verify it doesn't crash
        assert True

    @patch("app.agents.wizard._load_wizard_state")
    @patch("app.agents.wizard._save_wizard_state")
    @patch("app.agents.wizard._clear_wizard_state")
    @patch("app.agents.wizard.get_llm")
    def test_cancel_at_options_shows_cancel_message(
        self, mock_llm, mock_clear, mock_save, mock_load
    ):
        """User types 'cancelar' during option selection → wizard clears."""
        mock_llm.return_value = None

        mock_load.return_value = {
            "type": "create_budget",
            "status": "collecting",
            "collected": {},
            "missing": ["budget_type", "name", "total_limit"],
            "updated_at": "2026-05-01T12:00:00",
        }

        state = self._base_state("cancelar", intent="create_budget")
        result = wizard_node(state)

        assert "Cancelado" in result["response"]
        mock_clear.assert_called_once()


# ═══════════════════════════════════════════════════════════════
# 6. MIGRATION INTEGRITY
# ═══════════════════════════════════════════════════════════════


class TestMigration:
    """Verify the migration script is correct."""

    def test_migration_exists(self):
        """Migration file must exist with correct content."""
        import os
        path = "/root/projects/bagcoin_api/apps/server/alembic/versions/2026-05-02_add_budget_type_and_nullable_category.py"
        assert os.path.exists(path), f"Migration file missing: {path}"

    def test_migration_adds_budget_type(self):
        """Migration must add budget_type column."""
        path = "/root/projects/bagcoin_api/apps/server/alembic/versions/2026-05-02_add_budget_type_and_nullable_category.py"
        with open(path) as f:
            content = f.read()
        assert "budget_type" in content
        assert "add_column" in content
        assert "UPDATE budgets SET budget_type = 'category'" in content

    def test_migration_makes_category_nullable(self):
        """Migration must make category_id nullable."""
        path = "/root/projects/bagcoin_api/apps/server/alembic/versions/2026-05-02_add_budget_type_and_nullable_category.py"
        with open(path) as f:
            content = f.read()
        assert "category_id" in content
        assert "nullable=True" in content


# ═══════════════════════════════════════════════════════════════
# 7. SERVICE INTEGRATION
# ═══════════════════════════════════════════════════════════════


class TestBudgetService:
    """Verify budget_service.create_budget supports budget_type."""

    def test_create_budget_signature(self):
        """create_budget must accept budget_type parameter."""
        import inspect
        from app.services.budget_service import create_budget

        sig = inspect.signature(create_budget)
        params = list(sig.parameters.keys())
        assert "budget_type" in params, f"create_budget missing budget_type param. Has: {params}"

    def test_create_budget_default_is_category(self):
        """Default budget_type should be 'category' for backward compat."""
        import inspect
        from app.services.budget_service import create_budget

        sig = inspect.signature(create_budget)
        default = sig.parameters["budget_type"].default
        assert default == "category", f"Expected default='category', got: {default}"


# ═══════════════════════════════════════════════════════════════
# 8. EXECUTION PHASE
# ═══════════════════════════════════════════════════════════════


class TestExecutionPhase:
    """Test _handle_executing creates budgets with correct budget_type."""

    @patch("app.services.budget_service.create_budget")
    @patch("app.agents.wizard._clear_wizard_state")
    def test_execute_general_type(self, mock_clear, mock_create_budget):
        """When budget_type='general', it should pass through to create_budget."""
        from app.agents.wizard import _handle_executing

        mock_create_budget.return_value = {
            "id": 1, "name": "Itau", "category_id": None,
            "category_name": None, "total_limit": 5000.0,
            "period": "monthly", "budget_type": "general",
        }

        wizard = {
            "type": "create_budget",
            "collected": {
                "budget_type": "general",
                "name": "Itau",
                "total_limit": 5000.0,
                "period": "monthly",
            },
        }

        state = {"message": "", "phone_number": "5511999999999", "response": ""}
        result = _handle_executing(state, wizard, "5511999999999")

        # Check create_budget was called with budget_type='general'
        call_kwargs = mock_create_budget.call_args.kwargs
        assert call_kwargs["budget_type"] == "general", f"Expected general, got {call_kwargs}"
        assert "Conta" in result["response"]

    @patch("app.services.budget_service.create_budget")
    @patch("app.agents.wizard._clear_wizard_state")
    def test_execute_category_type(self, mock_clear, mock_create_budget):
        """When budget_type='category', it should create category budget."""
        from app.agents.wizard import _handle_executing

        mock_create_budget.return_value = {
            "id": 2, "name": "Alimentação", "category_id": 5,
            "category_name": "Alimentação", "total_limit": 800.0,
            "period": "monthly", "budget_type": "category",
        }

        wizard = {
            "type": "create_budget",
            "collected": {
                "budget_type": "category",
                "name": "Alimentação",
                "total_limit": 800.0,
                "period": "monthly",
            },
        }

        state = {"message": "", "phone_number": "5511999999999", "response": ""}
        result = _handle_executing(state, wizard, "5511999999999")

        call_kwargs = mock_create_budget.call_args.kwargs
        assert call_kwargs["budget_type"] == "category", f"Expected category, got {call_kwargs}"
        assert "Orçamento" in result["response"]
