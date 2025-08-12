#!/bin/bash

# Docker Quick Fix untuk 502 Bad Gateway Errors
# Script ini akan melakukan langkah-langkah perbaikan cepat untuk container Docker

echo "🐳 Docker 502 Bad Gateway Quick Fix"
echo "==================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 1. Check container status
print_status "Checking container status..."
if ! docker compose ps | grep "Up" > /dev/null; then
    print_error "Some containers are not running!"
    docker compose ps
    
    print_status "Starting all containers..."
    docker compose up -d
    sleep 10
fi

# 2. Clear Laravel caches inside container
print_status "Clearing Laravel caches..."
docker compose exec app php artisan config:clear || print_error "Failed to clear config cache"
docker compose exec app php artisan route:clear || print_error "Failed to clear route cache"
docker compose exec app php artisan view:clear || print_error "Failed to clear view cache"
docker compose exec app php artisan cache:clear || print_error "Failed to clear application cache"

# 3. Restart PHP-FPM (restart app container)
print_status "Restarting PHP-FPM container..."
docker compose restart app
sleep 5

# 4. Restart Nginx container
print_status "Restarting Nginx container..."
docker compose restart webserver
sleep 5

# 5. Check container logs for errors
print_status "Checking for recent errors in logs..."
echo "=== App Container Logs (last 20 lines) ==="
docker compose logs --tail=20 app | grep -i "error\|exception\|fatal" || echo "No errors found in app logs"

echo ""
echo "=== Nginx Container Logs (last 20 lines) ==="
docker compose logs --tail=20 webserver | grep -i "error\|502\|upstream" || echo "No errors found in nginx logs"

# 6. Fix permissions inside container
print_status "Fixing file permissions..."
docker compose exec app chown -R www-data:www-data /var/www/storage /var/www/bootstrap/cache
docker compose exec app chmod -R 775 /var/www/storage /var/www/bootstrap/cache

# 7. Restart queue workers
print_status "Restarting queue workers..."
if docker compose ps | grep -q "queue-worker"; then
    docker compose restart queue-worker
else
    # Alternative: restart queue in app container
    docker compose exec app php artisan queue:restart
fi

# 8. Check PHP configuration inside container
print_status "Checking PHP configuration..."
docker compose exec app php -v
docker compose exec app php -m | grep -E "opcache|mysql|redis" || print_error "Some PHP extensions missing"

# 9. Test database connection
print_status "Testing database connection..."
if docker compose exec app php artisan tinker --execute="DB::connection()->getPdo(); echo 'Database OK';" 2>/dev/null | grep -q "Database OK"; then
    print_success "Database connection is working"
else
    print_error "Database connection failed!"
    
    print_status "Restarting MySQL container..."
    docker compose restart mysql
    sleep 10
fi

# 10. Optimize for performance
print_status "Applying performance optimizations..."
docker compose exec app php artisan config:cache
docker compose exec app php artisan route:cache
docker compose exec app php artisan view:cache

# 11. Test the problematic endpoints
print_status "Testing application endpoints..."

# Wait for services to be ready
sleep 5

# Get the port nginx is running on
NGINX_PORT=$(docker compose port webserver 80 2>/dev/null | cut -d: -f2)
if [ -z "$NGINX_PORT" ]; then
    NGINX_PORT="80"
fi

BASE_URL="http://localhost:${NGINX_PORT}"

# Test main page
print_status "Testing main page..."
HTTP_CODE=$(curl -o /dev/null -s -w "%{http_code}" "${BASE_URL}/" 2>/dev/null || echo "000")
if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "302" ]; then
    print_success "Main page is working (HTTP $HTTP_CODE)"
else
    print_error "Main page has issues (HTTP $HTTP_CODE)"
fi

# Test jadwal endpoint
print_status "Testing /jadwal endpoint..."
HTTP_CODE=$(curl -o /dev/null -s -w "%{http_code}" "${BASE_URL}/jadwal" 2>/dev/null || echo "000")
if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "302" ]; then
    print_success "/jadwal is working (HTTP $HTTP_CODE)"
else
    print_error "/jadwal still has issues (HTTP $HTTP_CODE)"
fi

# Test users endpoint
print_status "Testing /users endpoint..."
HTTP_CODE=$(curl -o /dev/null -s -w "%{http_code}" "${BASE_URL}/users" 2>/dev/null || echo "000")
if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "302" ]; then
    print_success "/users is working (HTTP $HTTP_CODE)"
else
    print_error "/users still has issues (HTTP $HTTP_CODE)"
fi

# 12. Show container resource usage
print_status "Container resource usage:"
docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.MemPerc}}" | head -10

echo ""
print_success "🎯 Quick fix completed!"
echo "======================="
echo ""
echo "📊 If problems persist, check:"
echo "   docker compose logs -f app          # Follow app logs"
echo "   docker compose logs -f webserver    # Follow nginx logs"
echo "   docker compose logs -f mysql        # Follow database logs"
echo ""
echo "🔧 Advanced fixes:"
echo "   docker compose down && docker compose up -d --build  # Rebuild containers"
echo "   docker system prune -a                               # Clean Docker system"
echo "   ./docker-deploy.sh --force                          # Full redeployment"
echo ""
echo "🌐 Application URLs:"
echo "   Main App: ${BASE_URL}"
echo "   phpMyAdmin: http://localhost:8080"
echo ""
echo "💾 Quick commands:"
echo "   docker compose restart app                    # Restart app only"
echo "   docker compose exec app php artisan cache:clear  # Clear cache"
echo "   docker compose exec app bash                  # Access container shell"
