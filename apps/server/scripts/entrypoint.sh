#!/bin/bash
set -e

echo "=== BagCoin Backend Entrypoint ==="

# --- Wait for PostgreSQL ---
echo "⏳ Waiting for PostgreSQL..."
RETRIES=30
until pg_isready -h "$POSTGRES_HOST" -p "${POSTGRES_PORT:-5432}" -U "$POSTGRES_USER" 2>/dev/null; do
    RETRIES=$((RETRIES - 1))
    if [ $RETRIES -le 0 ]; then
        echo "❌ PostgreSQL not ready after 30 retries. Exiting."
        exit 1
    fi
    sleep 2
done
echo "✅ PostgreSQL is ready!"

# --- Run Alembic migrations if available ---
if [ -d "alembic" ] && [ -f "alembic.ini" ]; then
    echo "🔄 Running Alembic migrations..."
    alembic upgrade head
    echo "✅ Migrations applied!"
else
    echo "⏭️  No Alembic migrations directory found. Skipping."
fi

# --- Execute the CMD ---
echo "🚀 Starting application..."
exec "$@"
