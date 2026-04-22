#!/bin/bash
set -e

# BagCoin Deploy Script for Azure VM
# Run this on the Azure VM after cloning the repo

echo "BagCoin Production Deploy Script"
echo "===================================="

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if running as root
if [ "$EUID" -eq 0 ]; then
   echo -e "${RED}[ERROR] Please do not run as root${NC}"
   exit 1
fi

# Check Docker
if ! command -v docker &> /dev/null; then
    echo -e "${YELLOW}[INFO] Docker not found. Installing...${NC}"
    curl -fsSL https://get.docker.com | sh
    sudo usermod -aG docker $USER
    echo -e "${YELLOW}[WARN] Please log out and log back in, then re-run this script${NC}"
    exit 0
fi

# Check Docker Compose
if ! docker compose version &> /dev/null; then
    echo -e "${RED}[ERROR] Docker Compose plugin not found${NC}"
    exit 1
fi

# Check .env file
if [ ! -f .env ]; then
    echo -e "${RED}[ERROR] .env file not found!${NC}"
    echo "Please create a .env file with your configuration."
    echo "See DEPLOY.md for details."
    exit 1
fi

echo -e "${GREEN}[OK] Docker and Docker Compose are installed${NC}"
echo -e "${GREEN}[OK] .env file found${NC}"

# Build images
echo ""
echo "[INFO] Building Docker images..."
echo "This may take 5-10 minutes on the first run..."
docker compose -f docker-compose.prod.yml build

# Start services
echo ""
echo "[INFO] Starting services..."
docker compose -f docker-compose.prod.yml up -d

# Wait for services to be ready
echo ""
echo "[INFO] Waiting for services to be healthy..."
sleep 10

# Check health
echo ""
echo "[INFO] Health Check:"
HEALTH_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost/health || echo "000")
if [ "$HEALTH_STATUS" = "200" ]; then
    echo -e "${GREEN}[OK] Backend is healthy${NC}"
else
    echo -e "${YELLOW}[WARN] Backend health check returned $HEALTH_STATUS (may still be starting)${NC}"
fi

# Show status
echo ""
echo "[INFO] Service Status:"
docker compose -f docker-compose.prod.yml ps

# Get public IP
PUBLIC_IP=$(curl -s ifconfig.me || echo "unknown")

echo ""
echo -e "${GREEN}====================================${NC}"
echo -e "${GREEN}[OK] Deploy completed!${NC}"
echo -e "${GREEN}====================================${NC}"
echo ""
echo "[INFO] Access your application:"
echo "   Web App:        http://$PUBLIC_IP"
echo "   API Docs:       http://$PUBLIC_IP/api/docs"
echo "   Health:         http://$PUBLIC_IP/health"
echo "   QR Code:        http://$PUBLIC_IP/qr"
echo "   Metrics:        http://$PUBLIC_IP/metrics"
echo ""
echo "[INFO] Next step: Authenticate WhatsApp"
echo "   1. Open: http://$PUBLIC_IP/qr"
echo "   2. Copy the base64Image string"
echo "   3. Paste it at: https://base64.guru"
echo "   4. Scan the QR code with WhatsApp → Settings → Linked Devices"
echo ""
echo "[INFO] Useful commands:"
echo "   View logs:        docker compose -f docker-compose.prod.yml logs -f"
echo "   View WhatsApp:    docker compose -f docker-compose.prod.yml logs -f whatsapp"
echo "   Restart:          docker compose -f docker-compose.prod.yml restart"
echo "   Stop:             docker compose -f docker-compose.prod.yml down"
echo ""
