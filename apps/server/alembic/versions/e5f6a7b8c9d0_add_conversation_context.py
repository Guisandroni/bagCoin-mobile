"""Add conversation_context table

Revision ID: e5f6a7b8c9d0
Revises: d4e5f6a7b8c9
Create Date: 2026-04-26 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
import sqlmodel


# revision identifiers, used by Alembic.
revision: str = 'e5f6a7b8c9d0'
down_revision: Union[str, None] = 'd4e5f6a7b8c9'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'conversation_context',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.Column('awaiting_budget_month', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('pending_budget_category', sa.String(), nullable=True),
        sa.Column('pending_budget_amount', sa.Float(), nullable=True),
        sa.Column('awaiting_fund_field', sa.String(), nullable=True),
        sa.Column('pending_fund', sa.JSON(), nullable=True),
        sa.Column('last_intent', sa.String(), nullable=True),
        sa.Column('last_action', sa.String(), nullable=True),
        sa.Column('awaiting_file_type', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('pending_file_bytes', sa.LargeBinary(), nullable=True),
        sa.Column('pending_file_type', sa.String(), nullable=True),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('user_id'),
    )
    op.create_index(op.f('ix_conversation_context_user_id'), 'conversation_context', ['user_id'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_conversation_context_user_id'), table_name='conversation_context')
    op.drop_table('conversation_context')
