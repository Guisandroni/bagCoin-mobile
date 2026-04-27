"""add advanced features (budgets, funds, reminders, shopping, subscriptions, custom categories)

Revision ID: d4e5f6a7b8c9
Revises: c3d4e5f6a7b8
Create Date: 2025-04-25 20:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'd4e5f6a7b8c9'
down_revision: Union[str, None] = 'c3d4e5f6a7b8'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # budget
    op.create_table(
        'budget',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('year', sa.Integer(), nullable=False),
        sa.Column('month', sa.Integer(), nullable=False),
        sa.Column('total_budgeted', sa.Numeric(15, 2), nullable=False, server_default='0.0'),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['user.id']),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_budget_user_period', 'budget', ['user_id', 'year', 'month'])

    # budget_category
    op.create_table(
        'budget_category',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('budget_id', sa.Integer(), nullable=False),
        sa.Column('category_name', sa.String(100), nullable=False),
        sa.Column('budgeted_amount', sa.Numeric(15, 2), nullable=False),
        sa.Column('spent_amount', sa.Numeric(15, 2), nullable=False, server_default='0.0'),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['budget_id'], ['budget.id']),
        sa.PrimaryKeyConstraint('id')
    )

    # fund
    op.create_table(
        'fund',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(100), nullable=False),
        sa.Column('fund_type', sa.String(50), nullable=False, server_default='poupanca'),
        sa.Column('current_amount', sa.Numeric(15, 2), nullable=False, server_default='0.0'),
        sa.Column('target_amount', sa.Numeric(15, 2), nullable=True),
        sa.Column('reminder_frequency', sa.String(50), nullable=True),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['user.id']),
        sa.PrimaryKeyConstraint('id')
    )

    # fund_contribution
    op.create_table(
        'fund_contribution',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('fund_id', sa.Integer(), nullable=False),
        sa.Column('amount', sa.Numeric(15, 2), nullable=False),
        sa.Column('contribution_date', sa.DateTime(), nullable=False),
        sa.Column('note', sa.Text(), nullable=True),
        sa.ForeignKeyConstraint(['fund_id'], ['fund.id']),
        sa.PrimaryKeyConstraint('id')
    )

    # reminder
    op.create_table(
        'reminder',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('title', sa.String(255), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('due_date', sa.Date(), nullable=False),
        sa.Column('amount', sa.Numeric(15, 2), nullable=True),
        sa.Column('is_recurring', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('recurring_frequency', sa.String(50), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['user.id']),
        sa.PrimaryKeyConstraint('id')
    )

    # shopping_list
    op.create_table(
        'shopping_list',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(100), nullable=False, server_default='Lista de Compras'),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['user.id']),
        sa.PrimaryKeyConstraint('id')
    )

    # shopping_item
    op.create_table(
        'shopping_item',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('shopping_list_id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(255), nullable=False),
        sa.Column('quantity', sa.String(50), nullable=True),
        sa.Column('is_checked', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['shopping_list_id'], ['shopping_list.id']),
        sa.PrimaryKeyConstraint('id')
    )

    # subscription
    op.create_table(
        'subscription',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(100), nullable=False),
        sa.Column('amount', sa.Numeric(15, 2), nullable=False),
        sa.Column('category', sa.String(100), nullable=False),
        sa.Column('frequency', sa.String(50), nullable=False, server_default='mensal'),
        sa.Column('next_due_date', sa.Date(), nullable=False),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['user.id']),
        sa.PrimaryKeyConstraint('id')
    )

    # custom_category
    op.create_table(
        'custom_category',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(100), nullable=False),
        sa.Column('icon', sa.String(50), nullable=True),
        sa.Column('color', sa.String(7), nullable=True),
        sa.Column('category_type', sa.String(50), nullable=False, server_default='expense'),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['user.id']),
        sa.PrimaryKeyConstraint('id')
    )


def downgrade() -> None:
    op.drop_table('custom_category')
    op.drop_table('subscription')
    op.drop_table('shopping_item')
    op.drop_table('shopping_list')
    op.drop_table('reminder')
    op.drop_table('fund_contribution')
    op.drop_table('fund')
    op.drop_table('budget_category')
    op.drop_table('budget')
