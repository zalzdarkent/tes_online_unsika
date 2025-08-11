#!/bin/bash

# Quick Docker Deployment Script
# Usage: ./quick-deploy.sh

echo "🚀 Quick Docker Laravel Deployment"

# 1. Backup database (optional, comment out if not needed)
echo "📦 Creating database backup..."
mkdir -p backups
docker-compose exec -T mysql mysqldump -u root -pTpFBSyz35Fmc2ALT sql_onlinetest > "backups/backup_$(date +%Y%m%d_%H%M%S).sql" 2>/dev/null || echo "⚠️  Backup skipped (database not running)"

# 2. Pull latest code
echo "📥 Pulling latest code..."
git pull origin main

# 3. Rebuild and restart containers
echo "🔄 Rebuilding and restarting containers..."
docker-compose down
docker-compose up -d --build

# 4. Wait for containers to be ready
echo "⏳ Waiting for containers to start..."
sleep 15

# 5. Run Laravel commands
echo "⚡ Running Laravel optimizations..."
docker-compose exec app composer install --optimize-autoloader --no-dev
docker-compose exec app php artisan migrate --force
docker-compose exec app php artisan config:cache
docker-compose exec app php artisan route:cache
docker-compose exec app php artisan view:cache
docker-compose exec app php artisan queue:restart

# 6. Set permissions
echo "🔐 Setting permissions..."
docker-compose exec app chown -R www-data:www-data storage bootstrap/cache
docker-compose exec app chmod -R 775 storage bootstrap/cache

# 7. Check status
echo "✅ Deployment completed!"
docker-compose ps

echo ""
echo "🌐 Application should be running at your server IP"
echo "📊 Check logs with: docker-compose logs -f app"
