#!/bin/bash
set -e

echo "⏳ Aguardando PostgreSQL..."
until pg_isready -h postgres -U "${POSTGRES_USER:-bagcoin}" -d "${POSTGRES_DB:-bagcoin}"; do
  sleep 2
done
echo "✅ PostgreSQL está pronto!"

echo "⏳ Verificando Redis..."
if command -v redis-cli &> /dev/null && redis-cli -h redis ping 2>/dev/null | grep -q PONG; then
  echo "✅ Redis está pronto!"
else
  echo "⚠️ Redis não disponível (opcional)"
fi

# Executa migrações com Alembic se existir
if [ -f "/app/alembic.ini" ]; then
  echo "🔄 Rodando migrações..."
  alembic upgrade head
  echo "✅ Migrações concluídas!"
fi

echo "🚀 Iniciando BagCoin API..."
exec "$@"
