"""add_google_auth_and_phone

Revision ID: 0003
Revises: 370a47fce50c
Create Date: 2026-05-02

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = "0003"
down_revision: Union[str, None] = "370a47fce50c"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create users table if it doesn't exist (managed by Base.metadata.create_all)
    op.execute(
        """
        CREATE TABLE IF NOT EXISTS users (
            id UUID PRIMARY KEY,
            email VARCHAR(255) NOT NULL UNIQUE,
            hashed_password VARCHAR(255),
            full_name VARCHAR(255),
            is_active BOOLEAN NOT NULL DEFAULT TRUE,
            role VARCHAR(50) NOT NULL DEFAULT 'user',
            avatar_url VARCHAR(500),
            created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
            updated_at TIMESTAMP WITH TIME ZONE
        )
        """
    )
    op.execute("CREATE INDEX IF NOT EXISTS ix_users_email ON users (email)")

    # Add new columns to users table
    op.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS phone_number VARCHAR(20)")
    op.execute(
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS google_id VARCHAR(255)"
    )
    op.execute(
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS auth_provider VARCHAR(20) NOT NULL DEFAULT 'email'"
    )
    op.execute(
        "CREATE UNIQUE INDEX IF NOT EXISTS ix_users_google_id ON users (google_id)"
    )

    # Add user_uuid to transactions table
    op.execute(
        "ALTER TABLE transactions ADD COLUMN IF NOT EXISTS user_uuid UUID"
    )
    op.execute(
        "ALTER TABLE transactions ALTER COLUMN user_id DROP NOT NULL"
    )
    op.execute(
        "CREATE INDEX IF NOT EXISTS ix_transactions_user_uuid ON transactions (user_uuid)"
    )
    op.execute(
        """
        DO $$
        BEGIN
            IF NOT EXISTS (
                SELECT 1 FROM pg_constraint WHERE conname = 'fk_transactions_user_uuid'
            ) THEN
                ALTER TABLE transactions
                ADD CONSTRAINT fk_transactions_user_uuid
                FOREIGN KEY (user_uuid) REFERENCES users(id) ON DELETE CASCADE;
            END IF;
        END $$;
        """
    )


def downgrade() -> None:
    op.execute("ALTER TABLE transactions DROP CONSTRAINT IF EXISTS fk_transactions_user_uuid")
    op.execute("DROP INDEX IF EXISTS ix_transactions_user_uuid")
    op.execute("ALTER TABLE transactions DROP COLUMN IF EXISTS user_uuid")
    op.execute("ALTER TABLE transactions ALTER COLUMN user_id SET NOT NULL")

    op.execute("DROP INDEX IF EXISTS ix_users_google_id")
    op.execute("ALTER TABLE users DROP COLUMN IF EXISTS auth_provider")
    op.execute("ALTER TABLE users DROP COLUMN IF EXISTS google_id")
    op.execute("ALTER TABLE users DROP COLUMN IF EXISTS phone_number")
