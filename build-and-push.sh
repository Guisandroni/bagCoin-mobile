#!/bin/bash
set -e

# =============================================================================
# Bagcoin - Build & Push Docker Images to Docker Hub
# =============================================================================
# Usage:
#   ./build-and-push.sh [DOCKER_HUB_USERNAME]
#
# Example:
#   ./build-and-push.sh meuusuario
# =============================================================================

DOCKER_HUB_USERNAME=${1:-""}

if [ -z "$DOCKER_HUB_USERNAME" ]; then
    echo "Erro: Informe seu usuario do Docker Hub."
    echo "Uso: ./build-and-push.sh <docker_hub_username>"
    exit 1
fi

# Verificar login no Docker Hub
if ! docker info > /dev/null 2>&1; then
    echo "Erro: Docker nao esta rodando. Inicie o Docker primeiro."
    exit 1
fi

echo "=============================================="
echo "Bagcoin - Build & Push para Docker Hub"
echo "Usuario: $DOCKER_HUB_USERNAME"
echo "=============================================="
echo ""

# =============================================================================
# 1. Backend (Server + Worker usam a mesma imagem)
# =============================================================================
echo "[1/3] Buildando imagem do Backend (server + worker)..."
cd apps/server

docker build \
    --platform linux/amd64 \
    -t "$DOCKER_HUB_USERNAME/bagcoin-server:latest" \
    -t "$DOCKER_HUB_USERNAME/bagcoin-server:$(date +%Y%m%d-%H%M%S)" \
    .

cd ../..

echo ""
echo "[1/3] Publicando imagem do Backend..."
docker push "$DOCKER_HUB_USERNAME/bagcoin-server:latest"

# =============================================================================
# 2. WhatsApp Bridge
# =============================================================================
echo ""
echo "[2/3] Buildando imagem do WhatsApp Bridge..."
cd apps/whatsapp

docker build \
    --platform linux/amd64 \
    -t "$DOCKER_HUB_USERNAME/bagcoin-whatsapp:latest" \
    -t "$DOCKER_HUB_USERNAME/bagcoin-whatsapp:$(date +%Y%m%d-%H%M%S)" \
    .

cd ../..

echo ""
echo "[2/3] Publicando imagem do WhatsApp Bridge..."
docker push "$DOCKER_HUB_USERNAME/bagcoin-whatsapp:latest"

# =============================================================================
# 3. Web Frontend
# =============================================================================
echo ""
echo "[3/3] Buildando imagem do Web Frontend..."
cd apps/web

docker build \
    --platform linux/amd64 \
    -t "$DOCKER_HUB_USERNAME/bagcoin-web:latest" \
    -t "$DOCKER_HUB_USERNAME/bagcoin-web:$(date +%Y%m%d-%H%M%S)" \
    .

cd ../..

echo ""
echo "[3/3] Publicando imagem do Web Frontend..."
docker push "$DOCKER_HUB_USERNAME/bagcoin-web:latest"

# =============================================================================
# Resumo
# =============================================================================
echo ""
echo "=============================================="
echo "Build e push concluidos com sucesso!"
echo "=============================================="
echo ""
echo "Imagens publicadas:"
echo "  - $DOCKER_HUB_USERNAME/bagcoin-server:latest"
echo "  - $DOCKER_HUB_USERNAME/bagcoin-whatsapp:latest"
echo "  - $DOCKER_HUB_USERNAME/bagcoin-web:latest"
echo ""
echo "Para usar no Azure Container Apps, atualize o"
echo "docker-compose.azure.yml com seu usuario."
echo ""
