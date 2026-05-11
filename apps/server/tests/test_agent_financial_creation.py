"""Direct agent tests for category, transaction, and budget creation."""

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from uuid import uuid4

from app.db.base import Base
import app.db.models  # noqa: F401
from app.db.models.agent_log import AgentLog
from app.db.models.budget import Budget
from app.db.models.category import Category
from app.db.models.goal import Goal
from app.db.models.phone_conversation import PhoneConversation
from app.db.models.phone_user import PhoneUser
from app.db.models.transaction import Transaction
from app.db.models.user import User


def _session_factory():
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(
        engine,
        tables=[
            User.__table__,
            PhoneUser.__table__,
            Category.__table__,
            Transaction.__table__,
            Budget.__table__,
            Goal.__table__,
            PhoneConversation.__table__,
            AgentLog.__table__,
        ],
    )
    return sessionmaker(bind=engine)


def _patch_agent_db(monkeypatch):
    factory = _session_factory()
    import app.agents.persistence as persistence
    import app.services.budget_service as budget_service

    monkeypatch.setattr(persistence, "sync_session_maker", factory)
    monkeypatch.setattr(budget_service, "sync_session_maker", factory)
    monkeypatch.setattr("app.services.deduplication_service.is_duplicate", lambda *_, **__: False)
    monkeypatch.setattr("app.services.pattern_learning_service.learn_from_transaction", lambda *_, **__: None)
    return factory


def test_agent_creates_custom_category(monkeypatch):
    factory = _patch_agent_db(monkeypatch)
    from app.agents.persistence import create_category

    created = create_category("5511999999999", "Colecionáveis")

    assert created is not None
    assert created["name"] == "Colecionáveis"
    with factory() as db:
        category = db.query(Category).filter(Category.name == "Colecionáveis").one()
        assert category.is_default is False


def test_agent_transaction_resolves_default_alias_without_duplicate(monkeypatch):
    factory = _patch_agent_db(monkeypatch)
    from app.agents.persistence import save_transaction

    state = {
        "phone_number": "5511999999999",
        "source_format": "text",
        "extracted_data": {
            "type": "EXPENSE",
            "amount": 42.0,
            "category": "mercado",
            "description": "Compra no mercado",
            "confidence": 0.9,
        },
    }

    result = save_transaction(state)

    assert result["category_name"] == "Supermercado"
    with factory() as db:
        assert db.query(Category).filter(Category.name == "Mercado").count() == 0
        assert db.query(Category).filter(Category.name == "Supermercado").count() == 1
        tx = db.query(Transaction).one()
        assert tx.category.name == "Supermercado"


def test_agent_transaction_uses_existing_custom_category(monkeypatch):
    factory = _patch_agent_db(monkeypatch)
    from app.agents.persistence import create_category, save_transaction

    create_category("5511999999999", "Colecionáveis")
    state = {
        "phone_number": "5511999999999",
        "source_format": "text",
        "extracted_data": {
            "type": "EXPENSE",
            "amount": 99.0,
            "category": "Colecionáveis",
            "description": "Item raro",
            "confidence": 0.9,
        },
    }

    save_transaction(state)

    with factory() as db:
        assert db.query(Category).filter(Category.name == "Colecionáveis").count() == 1
        tx = db.query(Transaction).one()
        assert tx.category.name == "Colecionáveis"


def test_agent_budget_uses_existing_default_category(monkeypatch):
    factory = _patch_agent_db(monkeypatch)
    from app.services.budget_service import create_budget

    budget = create_budget(
        phone_number="5511999999999",
        name="mercado",
        total_limit=500,
        period="monthly",
        budget_type="category",
    )

    assert budget["category_name"] == "Supermercado"
    with factory() as db:
        saved = db.query(Budget).one()
        assert saved.category.name == "Supermercado"
        assert db.query(Category).filter(Category.name == "Mercado").count() == 0


def test_agent_budget_links_web_user_uuid(monkeypatch):
    factory = _patch_agent_db(monkeypatch)
    from app.services.budget_service import create_budget

    web_user_id = uuid4()
    with factory() as db:
        phone_user = PhoneUser(
            phone_number="5511999999999",
            merged_into_user_id=web_user_id,
        )
        web_user = User(
            id=web_user_id,
            email="linked-budget@bagcoin.com",
            hashed_password="x",
            full_name="Linked",
        )
        db.add_all([web_user, phone_user])
        db.commit()

    create_budget(
        phone_number="5511999999999",
        name="Supermercado",
        total_limit=500,
        period="monthly",
        budget_type="category",
    )

    with factory() as db:
        saved = db.query(Budget).one()
        assert saved.user_uuid == web_user_id
        assert saved.category_id is not None


def test_agent_goal_links_web_user_uuid(monkeypatch):
    factory = _patch_agent_db(monkeypatch)
    from app.services.budget_service import create_goal

    web_user_id = uuid4()
    with factory() as db:
        phone_user = PhoneUser(
            phone_number="5511999999999",
            merged_into_user_id=web_user_id,
        )
        web_user = User(
            id=web_user_id,
            email="linked-goal@bagcoin.com",
            hashed_password="x",
            full_name="Linked",
        )
        db.add_all([web_user, phone_user])
        db.commit()

    create_goal("5511999999999", "Viagem", 3000)

    with factory() as db:
        saved = db.query(Goal).one()
        assert saved.user_uuid == web_user_id


def test_agent_manage_blocks_account_creation(monkeypatch):
    from app.agents.orchestrator import smart_manage_node

    monkeypatch.setattr("app.agents.orchestrator.get_llm", lambda *_, **__: None)

    state = {
        "phone_number": "5511999999999",
        "message": "Criar conta Nubank com saldo 1000",
        "response": None,
    }

    result = smart_manage_node(state)

    assert "não crio contas" in result["response"]
    assert "orçamento por categoria" in result["response"]


def test_agent_manage_blocks_credit_card_creation(monkeypatch):
    from app.agents.orchestrator import smart_manage_node

    monkeypatch.setattr("app.agents.orchestrator.get_llm", lambda *_, **__: None)

    state = {
        "phone_number": "5511999999999",
        "message": "Criar cartão de crédito Inter",
        "response": None,
    }

    result = smart_manage_node(state)

    assert "não crio contas" in result["response"]
    assert "orçamento por categoria" in result["response"]


def test_route_by_intent_sends_account_request_to_blocker():
    from app.agents.orchestrator import route_by_intent

    state = {
        "message": "Criar conta Nubank com saldo 1000",
        "intent": "register_expense",
        "macro_intent": "register",
        "error": None,
        "response": None,
    }

    assert route_by_intent(state) == "smart_manage"


def test_agent_category_aliases_do_not_explode_categories(monkeypatch):
    factory = _patch_agent_db(monkeypatch)
    from app.agents.persistence import save_transaction

    inputs = [
        ("EXPENSE", "mercado", "Mercado"),
        ("EXPENSE", "supermercado", "Supermercado"),
        ("EXPENSE", "ifood", "iFood"),
        ("INCOME", "freela", "Freela"),
    ]
    for tx_type, category, description in inputs:
        save_transaction({
            "phone_number": "5511999999999",
            "source_format": "text",
            "extracted_data": {
                "type": tx_type,
                "amount": 10.0,
                "category": category,
                "description": description,
                "confidence": 0.9,
            },
        })

    with factory() as db:
        names = {category.name for category in db.query(Category).all()}
        assert "Mercado" not in names
        assert "Ifood" not in names
        assert "Freela" not in names
        assert {"Supermercado", "Delivery", "Freelance"}.issubset(names)
