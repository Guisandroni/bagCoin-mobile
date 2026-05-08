#!/bin/sh
# Warmup script — precompila todas as paginas apos startup
# Evita o delay de 5-6s na primeira visita a cada rota

echo "[warmup] Aguardando Next.js ficar pronto..."
for i in $(seq 1 30); do
  if curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 | grep -q "200\|304"; then
    echo "[warmup] Servidor pronto!"
    break
  fi
  sleep 1
done

echo "[warmup] Precompilando paginas..."
for path in / /login /app /app/transacoes /app/orcamentos /app/metas /app/relatorios /app/contas /app/confirmacoes /app/configuracoes; do
  status=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:3000${path}" 2>/dev/null)
  echo "  ${path} → ${status}"
done

echo "[warmup] Concluido!"
