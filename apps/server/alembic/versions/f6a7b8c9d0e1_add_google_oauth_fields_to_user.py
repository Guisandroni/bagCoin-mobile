"""Add google oauth fields to user

Revision ID: f6a7b8c9d0e1
Revises: e5f6a7b8c9d0
Create Date: 2026-04-27 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'f6a7b8c9d0e1'
down_revision: Union[str, None] = 'e5f6a7b8c9d0'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add email column
    op.add_column('user', sa.Column('email', sa.String(), nullable=True))
    op.create_index(op.f('ix_user_email'), 'user', ['email'], unique=False)
    
    # Add google_id column
    op.add_column('user', sa.Column('google_id', sa.String(), nullable=True))
    op.create_index(op.f('ix_user_google_id'), 'user', ['google_id'], unique=False)
    
    # Add avatar_url column
    op.add_column('user', sa.Column('avatar_url', sa.String(), nullable=True))


def downgrade() -> None:
    op.drop_column('user', 'avatar_url')
    op.drop_index(op.f('ix_user_google_id'), table_name='user')
    op.drop_column('user', 'google_id')
    op.drop_index(op.f('ix_user_email'), table_name='user')
    op.drop_column('user', 'email')
