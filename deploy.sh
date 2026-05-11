#!/bin/bash
set -e

cd ~/bagCoin

echo "📦 Pulling latest changes..."
git pull origin main

echo "🚀 Starting containers..."
docker-compose --env-file .env.prod -f docker-compose.prod.yml up -d --build --remove-orphans

echo "🧹 Cleaning up old images..."
docker image prune -f

echo "✅ Done! Containers status:"
docker-compose --env-file .env.prod -f docker-compose.prod.yml ps
