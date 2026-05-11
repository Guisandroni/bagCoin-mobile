"""Seed database with realistic financial data for 2 test users.

Usage:
    python -m app.commands.seed_financial
    python -m app.commands.seed_financial --clear

Creates 2 web users with linked phone_users, categories, transactions,
goals, budgets, accounts, and credit cards.
"""

import asyncio
import uuid
from datetime import datetime, timedelta, timezone

import click

from app.commands import command, error, info, success, warning


@command("seed-financial", help="Seed database with realistic financial data for 2 test users")
@click.option("--clear", is_flag=True, help="Clear existing financial data before seeding")
def seed_financial(clear: bool) -> None:
    """Seed the database with 2 test users and their financial data."""

    async def _seed() -> None:
        from app.core.security import get_password_hash
        from app.core.financial_categories import DEFAULT_FINANCIAL_CATEGORIES
        from app.db.models.account import Account
        from app.db.models.budget import Budget
        from app.db.models.category import Category
        from app.db.models.credit_card import CreditCard
        from app.db.models.goal import Goal
        from app.db.models.phone_user import PhoneUser
        from app.db.models.report import Report
        from app.db.models.transaction import Transaction
        from app.db.models.user import User
        from app.db.session import get_db_context
        from sqlalchemy import select

        async with get_db_context() as db:
            # ── Clear existing data ──────────────────────────────────
            if clear:
                info("Clearing existing financial data...")
                for model in [Transaction, Budget, Goal, Category, Account, CreditCard, Report]:
                    await db.execute(model.__table__.delete())
                await db.flush()
                info("Cleared all financial data.")

            # ── Check if test users already exist ─────────────────────
            existing_ana = await db.execute(select(User).where(User.email == "ana@bagcoin.com"))
            existing_carlos = await db.execute(select(User).where(User.email == "carlos@bagcoin.com"))
            ana_user = existing_ana.scalar_one_or_none()
            carlos_user = existing_carlos.scalar_one_or_none()

            # ── Create web users ─────────────────────────────────────
            if not ana_user:
                ana_user = User(
                    email="ana@bagcoin.com",
                    hashed_password=get_password_hash("bagcoin123"),
                    full_name="Ana Silva",
                    phone_number="+5511999990001",
                    auth_provider="email",
                    is_active=True,
                    role="user",
                )
                db.add(ana_user)
                await db.flush()
                info(f"Created user: Ana Silva ({ana_user.id})")
            else:
                info(f"User already exists: Ana Silva ({ana_user.id})")

            if not carlos_user:
                carlos_user = User(
                    email="carlos@bagcoin.com",
                    hashed_password=get_password_hash("bagcoin123"),
                    full_name="Carlos Oliveira",
                    phone_number="+5511988880002",
                    auth_provider="email",
                    is_active=True,
                    role="user",
                )
                db.add(carlos_user)
                await db.flush()
                info(f"Created user: Carlos Oliveira ({carlos_user.id})")
            else:
                info(f"User already exists: Carlos Oliveira ({carlos_user.id})")

            # ── Create phone_users (linked to web users) ─────────────
            existing_ana_phone = await db.execute(
                select(PhoneUser).where(PhoneUser.phone_number == "+5511999990001")
            )
            ana_phone = existing_ana_phone.scalar_one_or_none()

            if not ana_phone:
                ana_phone = PhoneUser(
                    phone_number="+5511999990001",
                    name="Ana Silva",
                    status="active",
                    platform="whatsapp",
                    preferences={"language": "pt-BR", "currency": "BRL"},
                    financial_profile={},
                    merged_into_user_id=ana_user.id,
                )
                db.add(ana_phone)
                await db.flush()
                info(f"Created phone_user: Ana ({ana_phone.id})")
            else:
                ana_phone.merged_into_user_id = ana_user.id
                info(f"Phone user already exists: Ana ({ana_phone.id})")

            existing_carlos_phone = await db.execute(
                select(PhoneUser).where(PhoneUser.phone_number == "+5511988880002")
            )
            carlos_phone = existing_carlos_phone.scalar_one_or_none()

            if not carlos_phone:
                carlos_phone = PhoneUser(
                    phone_number="+5511988880002",
                    name="Carlos Oliveira",
                    status="active",
                    platform="whatsapp",
                    preferences={"language": "pt-BR", "currency": "BRL"},
                    financial_profile={},
                    merged_into_user_id=carlos_user.id,
                )
                db.add(carlos_phone)
                await db.flush()
                info(f"Created phone_user: Carlos ({carlos_phone.id})")
            else:
                carlos_phone.merged_into_user_id = carlos_user.id
                info(f"Phone user already exists: Carlos ({carlos_phone.id})")

            await db.flush()

            # ── Helper: create categories for a phone_user ───────────
            category_names = [(category.name, category.color) for category in DEFAULT_FINANCIAL_CATEGORIES]

            def create_categories(phone_user_id: int) -> list:
                cats = []
                for name, color in category_names:
                    cat = Category(
                        user_id=phone_user_id,
                        name=name,
                        is_default=True,
                    )
                    db.add(cat)
                    cats.append(cat)
                return cats

            # ── Seed Ana's data ──────────────────────────────────────
            ana_cats = create_categories(ana_phone.id)
            await db.flush()
            ana_cat_by_name = {cat.name: cat for cat in ana_cats}
            info(f"Created {len(ana_cats)} categories for Ana")

            now = datetime.now(timezone.utc)

            ana_transactions = [
                Transaction(user_uuid=ana_user.id, user_id=ana_phone.id, type="INCOME", amount=8500.00, description="Salário Maio", category_id=ana_cat_by_name["Salário"].id, source_format="manual", confidence_score=1.0, transaction_date=now - timedelta(days=6)),
                Transaction(user_uuid=ana_user.id, user_id=ana_phone.id, type="INCOME", amount=3000.00, description="Freelance Design", category_id=ana_cat_by_name["Freelance"].id, source_format="manual", confidence_score=1.0, transaction_date=now - timedelta(days=5)),
                Transaction(user_uuid=ana_user.id, user_id=ana_phone.id, type="EXPENSE", amount=245.80, description="Supermercado", category_id=ana_cat_by_name["Supermercado"].id, source_format="text", confidence_score=1.0, transaction_date=now - timedelta(days=5)),
                Transaction(user_uuid=ana_user.id, user_id=ana_phone.id, type="EXPENSE", amount=158.30, description="Restaurante Japonês", category_id=ana_cat_by_name["Restaurantes"].id, source_format="text", confidence_score=1.0, transaction_date=now - timedelta(days=4)),
                Transaction(user_uuid=ana_user.id, user_id=ana_phone.id, type="EXPENSE", amount=112.80, description="Gasolina", category_id=ana_cat_by_name["Combustível"].id, source_format="text", confidence_score=1.0, transaction_date=now - timedelta(days=3)),
                Transaction(user_uuid=ana_user.id, user_id=ana_phone.id, type="EXPENSE", amount=45.50, description="Uber", category_id=ana_cat_by_name["Transporte"].id, source_format="text", confidence_score=1.0, transaction_date=now - timedelta(days=4)),
                Transaction(user_uuid=ana_user.id, user_id=ana_phone.id, type="EXPENSE", amount=1200.00, description="Aluguel", category_id=ana_cat_by_name["Aluguel"].id, source_format="manual", confidence_score=1.0, transaction_date=now - timedelta(days=7)),
                Transaction(user_uuid=ana_user.id, user_id=ana_phone.id, type="EXPENSE", amount=45.90, description="Netflix", category_id=ana_cat_by_name["Assinaturas"].id, source_format="manual", confidence_score=1.0, transaction_date=now - timedelta(days=3)),
                Transaction(user_uuid=ana_user.id, user_id=ana_phone.id, type="EXPENSE", amount=32.50, description="Cinema", category_id=ana_cat_by_name["Lazer"].id, source_format="text", confidence_score=1.0, transaction_date=now - timedelta(days=2)),
                Transaction(user_uuid=ana_user.id, user_id=ana_phone.id, type="EXPENSE", amount=89.90, description="Farmácia", category_id=ana_cat_by_name["Farmácia"].id, source_format="text", confidence_score=1.0, transaction_date=now - timedelta(days=1)),
            ]
            for tx in ana_transactions:
                db.add(tx)
            await db.flush()
            info(f"Created {len(ana_transactions)} transactions for Ana")

            ana_goals = [
                Goal(user_uuid=ana_user.id, user_id=ana_phone.id, title="Viagem Japão", target_amount=15000.00, current_amount=8200.00, status="active", deadline=now + timedelta(days=200)),
                Goal(user_uuid=ana_user.id, user_id=ana_phone.id, title="Reserva Emergência", target_amount=30000.00, current_amount=18600.00, status="active"),
                Goal(user_uuid=ana_user.id, user_id=ana_phone.id, title="MacBook Pro", target_amount=22000.00, current_amount=22000.00, status="completed", deadline=now - timedelta(days=7)),
            ]
            for g in ana_goals:
                db.add(g)
            await db.flush()
            info(f"Created {len(ana_goals)} goals for Ana")

            ana_budgets = [
                Budget(user_uuid=ana_user.id, user_id=ana_phone.id, name="Supermercado", category_id=ana_cat_by_name["Supermercado"].id, period="monthly", total_limit=600.00, budget_type="category"),
                Budget(user_uuid=ana_user.id, user_id=ana_phone.id, name="Transporte", category_id=ana_cat_by_name["Transporte"].id, period="monthly", total_limit=400.00, budget_type="category"),
                Budget(user_uuid=ana_user.id, user_id=ana_phone.id, name="Lazer", category_id=ana_cat_by_name["Lazer"].id, period="monthly", total_limit=300.00, budget_type="category"),
                Budget(user_uuid=ana_user.id, user_id=ana_phone.id, name="Aluguel", category_id=ana_cat_by_name["Aluguel"].id, period="monthly", total_limit=1500.00, budget_type="category"),
            ]
            for b in ana_budgets:
                db.add(b)
            await db.flush()
            info(f"Created {len(ana_budgets)} budgets for Ana")

            ana_accounts = [
                Account(user_id=ana_user.id, name="Conta Corrente", bank="Nubank", type="CHECKING", balance=12450.30, color="#8B5CF6", active=True),
                Account(user_id=ana_user.id, name="Poupança", bank="Itaú", type="SAVINGS", balance=8118.12, color="#10B981", active=True),
            ]
            for a in ana_accounts:
                db.add(a)
            await db.flush()
            info(f"Created {len(ana_accounts)} accounts for Ana")

            ana_cards = [
                CreditCard(user_id=ana_user.id, name="Nubank Visa", issuer="Visa", limit=8000.00, closing_day=10, due_day=20, color="#8B5CF6", active=True),
            ]
            for c in ana_cards:
                db.add(c)
            await db.flush()
            info(f"Created {len(ana_cards)} credit cards for Ana")

            # ── Seed Carlos's data ────────────────────────────────────
            carlos_cats = create_categories(carlos_phone.id)
            await db.flush()
            carlos_cat_by_name = {cat.name: cat for cat in carlos_cats}
            info(f"Created {len(carlos_cats)} categories for Carlos")

            carlos_transactions = [
                Transaction(user_uuid=carlos_user.id, user_id=carlos_phone.id, type="INCOME", amount=6200.00, description="Salário", category_id=carlos_cat_by_name["Salário"].id, source_format="manual", confidence_score=1.0, transaction_date=now - timedelta(days=5)),
                Transaction(user_uuid=carlos_user.id, user_id=carlos_phone.id, type="INCOME", amount=1500.00, description="Consultoria", category_id=carlos_cat_by_name["Freelance"].id, source_format="manual", confidence_score=1.0, transaction_date=now - timedelta(days=3)),
                Transaction(user_uuid=carlos_user.id, user_id=carlos_phone.id, type="EXPENSE", amount=180.00, description="Restaurante", category_id=carlos_cat_by_name["Restaurantes"].id, source_format="text", confidence_score=1.0, transaction_date=now - timedelta(days=4)),
                Transaction(user_uuid=carlos_user.id, user_id=carlos_phone.id, type="EXPENSE", amount=320.00, description="Mercado", category_id=carlos_cat_by_name["Supermercado"].id, source_format="text", confidence_score=1.0, transaction_date=now - timedelta(days=5)),
                Transaction(user_uuid=carlos_user.id, user_id=carlos_phone.id, type="EXPENSE", amount=67.00, description="Combustível", category_id=carlos_cat_by_name["Combustível"].id, source_format="text", confidence_score=1.0, transaction_date=now - timedelta(days=3)),
                Transaction(user_uuid=carlos_user.id, user_id=carlos_phone.id, type="EXPENSE", amount=950.00, description="Aluguel", category_id=carlos_cat_by_name["Aluguel"].id, source_format="manual", confidence_score=1.0, transaction_date=now - timedelta(days=6)),
                Transaction(user_uuid=carlos_user.id, user_id=carlos_phone.id, type="EXPENSE", amount=150.00, description="Academia", category_id=carlos_cat_by_name["Saúde"].id, source_format="manual", confidence_score=1.0, transaction_date=now - timedelta(days=2)),
                Transaction(user_uuid=carlos_user.id, user_id=carlos_phone.id, type="EXPENSE", amount=89.00, description="Livros", category_id=carlos_cat_by_name["Educação"].id, source_format="text", confidence_score=1.0, transaction_date=now - timedelta(days=1)),
            ]
            for tx in carlos_transactions:
                db.add(tx)
            await db.flush()
            info(f"Created {len(carlos_transactions)} transactions for Carlos")

            carlos_goals = [
                Goal(user_uuid=carlos_user.id, user_id=carlos_phone.id, title="Carro Novo", target_amount=60000.00, current_amount=15000.00, status="active", deadline=now + timedelta(days=365)),
                Goal(user_uuid=carlos_user.id, user_id=carlos_phone.id, title="Curso Pós-Graduação", target_amount=12000.00, current_amount=3500.00, status="active", deadline=now + timedelta(days=240)),
            ]
            for g in carlos_goals:
                db.add(g)
            await db.flush()
            info(f"Created {len(carlos_goals)} goals for Carlos")

            carlos_budgets = [
                Budget(user_uuid=carlos_user.id, user_id=carlos_phone.id, name="Supermercado", category_id=carlos_cat_by_name["Supermercado"].id, period="monthly", total_limit=800.00, budget_type="category"),
                Budget(user_uuid=carlos_user.id, user_id=carlos_phone.id, name="Transporte", category_id=carlos_cat_by_name["Transporte"].id, period="monthly", total_limit=300.00, budget_type="category"),
                Budget(user_uuid=carlos_user.id, user_id=carlos_phone.id, name="Aluguel", category_id=carlos_cat_by_name["Aluguel"].id, period="monthly", total_limit=1200.00, budget_type="category"),
            ]
            for b in carlos_budgets:
                db.add(b)
            await db.flush()
            info(f"Created {len(carlos_budgets)} budgets for Carlos")

            carlos_accounts = [
                Account(user_id=carlos_user.id, name="Conta Corrente", bank="Bradesco", type="CHECKING", balance=7200.50, color="#F59E0B", active=True),
                Account(user_id=carlos_user.id, name="Investimentos", bank="XP", type="SAVINGS", balance=15000.00, color="#3B82F6", active=True),
            ]
            for a in carlos_accounts:
                db.add(a)
            await db.flush()
            info(f"Created {len(carlos_accounts)} accounts for Carlos")

            carlos_cards = [
                CreditCard(user_id=carlos_user.id, name="Inter Mastercard", issuer="Mastercard", limit=5000.00, closing_day=15, due_day=25, color="#F59E0B", active=True),
            ]
            for c in carlos_cards:
                db.add(c)
            await db.flush()
            info(f"Created {len(carlos_cards)} credit cards for Carlos")

            await db.commit()
            success("Seed complete!")
            info(f"  Ana:   ana@bagcoin.com / bagcoin123")
            info(f"  Carlos: carlos@bagcoin.com / bagcoin123")

    asyncio.run(_seed())
