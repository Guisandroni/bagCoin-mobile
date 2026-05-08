"""add_integration_link_tokens_and_phone_user_merge

Revision ID: e8f1a2b3c4d5
Revises: de3006439209
Create Date: 2026-05-04

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "e8f1a2b3c4d5"
down_revision: Union[str, None] = "de3006439209"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.alter_column(
        "users",
        "phone_number",
        existing_type=sa.String(length=20),
        type_=sa.String(length=80),
        existing_nullable=True,
    )

    op.add_column(
        "phone_users",
        sa.Column(
            "merged_into_user_id",
            postgresql.UUID(as_uuid=True),
            nullable=True,
        ),
    )
    op.create_foreign_key(
        op.f("phone_users_merged_into_user_id_fkey"),
        "phone_users",
        "users",
        ["merged_into_user_id"],
        ["id"],
        ondelete="SET NULL",
    )

    op.create_table(
        "integration_link_tokens",
        sa.Column("token", sa.String(length=64), nullable=False),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("channel", sa.String(length=20), nullable=False),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("consumed_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(
            ["user_id"],
            ["users.id"],
            name=op.f("integration_link_tokens_user_id_fkey"),
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("token", name=op.f("integration_link_tokens_pkey")),
    )
    op.create_index(
        op.f("integration_link_tokens_user_id_idx"),
        "integration_link_tokens",
        ["user_id"],
        unique=False,
    )
    op.create_index(
        op.f("integration_link_tokens_expires_at_idx"),
        "integration_link_tokens",
        ["expires_at"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index(op.f("integration_link_tokens_expires_at_idx"), table_name="integration_link_tokens")
    op.drop_index(op.f("integration_link_tokens_user_id_idx"), table_name="integration_link_tokens")
    op.drop_table("integration_link_tokens")

    op.drop_constraint(
        op.f("phone_users_merged_into_user_id_fkey"),
        "phone_users",
        type_="foreignkey",
    )
    op.drop_column("phone_users", "merged_into_user_id")

    op.alter_column(
        "users",
        "phone_number",
        existing_type=sa.String(length=80),
        type_=sa.String(length=20),
        existing_nullable=True,
    )
