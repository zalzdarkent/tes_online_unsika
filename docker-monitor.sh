#!/bin/bash

# Docker Performance Monitoring Script
# Script untuk monitoring performa container Docker Laravel

echo "🐳 Docker Performance Monitor"
echo "============================="

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

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 1. Container Status Overview
echo ""
print_status "📊 Container Status Overview:"
echo "----------------------------"
docker compose ps

# 2. Container Resource Usage
echo ""
print_status "💾 Container Resource Usage:"
echo "----------------------------"
docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.MemPerc}}\t{{.NetIO}}\t{{.BlockIO}}"

# 3. Docker System Info
echo ""
print_status "🏗️ Docker System Info:"
echo "----------------------"
docker system df

# 4. Check Laravel Application Health
echo ""
print_status "🔍 Laravel Application Health:"
echo "------------------------------"
if docker compose exec app php artisan about 2>/dev/null; then
    print_success "Laravel application is healthy"
else
    print_error "Laravel application health check failed"
fi

# 5. Database Connection Test
echo ""
print_status "🗄️ Database Connection Test:"
echo "----------------------------"
if docker compose exec app php artisan tinker --execute="DB::connection()->getPdo(); echo 'Database connected successfully';" 2>/dev/null | grep -q "Database connected"; then
    print_success "Database connection is working"
else
    print_error "Database connection failed"
fi

# 6. Queue Status
echo ""
print_status "⚡ Queue Worker Status:"
echo "---------------------"
if docker compose ps | grep -q "queue-worker.*Up"; then
    print_success "Queue worker container is running"
else
    print_warning "Queue worker container is not running"
fi

# Check for failed jobs
FAILED_JOBS=$(docker compose exec app php artisan queue:failed --format=json 2>/dev/null | jq length 2>/dev/null || echo "0")
if [ "$FAILED_JOBS" -gt 0 ]; then
    print_warning "Found $FAILED_JOBS failed jobs"
else
    print_success "No failed jobs found"
fi

# 7. Recent Container Logs Analysis
echo ""
print_status "📝 Recent Error Analysis:"
echo "------------------------"

echo "=== App Container Errors (last 10) ==="
docker compose logs --tail=50 app 2>/dev/null | grep -i "error\|exception\|fatal" | tail -10 || echo "No recent errors found"

echo ""
echo "=== Nginx Container Errors (last 10) ==="
docker compose logs --tail=50 webserver 2>/dev/null | grep -i "error\|502\|upstream" | tail -10 || echo "No recent nginx errors found"

echo ""
echo "=== MySQL Container Errors (last 5) ==="
docker compose logs --tail=20 mysql 2>/dev/null | grep -i "error\|warning" | tail -5 || echo "No recent database errors found"

# 8. Performance Test
echo ""
print_status "⏱️ Performance Test:"
echo "-------------------"

# Get nginx port
NGINX_PORT=$(docker compose port webserver 80 2>/dev/null | cut -d: -f2)
if [ -z "$NGINX_PORT" ]; then
    NGINX_PORT="80"
fi

BASE_URL="http://localhost:${NGINX_PORT}"

# Test response times
echo "Testing response times..."

# Main page
MAIN_TIME=$(curl -o /dev/null -s -w "%{time_total}" "${BASE_URL}/" 2>/dev/null || echo "FAILED")
echo "Main page: ${MAIN_TIME}s"

# Jadwal page
JADWAL_TIME=$(curl -o /dev/null -s -w "%{time_total}" "${BASE_URL}/jadwal" 2>/dev/null || echo "FAILED")
echo "Jadwal page: ${JADWAL_TIME}s"

# Users page
USERS_TIME=$(curl -o /dev/null -s -w "%{time_total}" "${BASE_URL}/users" 2>/dev/null || echo "FAILED")
echo "Users page: ${USERS_TIME}s"

# Koreksi page
KOREKSI_TIME=$(curl -o /dev/null -s -w "%{time_total}" "${BASE_URL}/koreksi" 2>/dev/null || echo "FAILED")
echo "Koreksi page: ${KOREKSI_TIME}s"

# 9. PHP Configuration Check
echo ""
print_status "🔧 PHP Configuration:"
echo "--------------------"
echo "PHP Version:"
docker compose exec app php -v | head -1

echo ""
echo "Memory Limit:"
docker compose exec app php -r "echo ini_get('memory_limit') . PHP_EOL;"

echo "Max Execution Time:"
docker compose exec app php -r "echo ini_get('max_execution_time') . 's' . PHP_EOL;"

echo "OpCache Status:"
docker compose exec app php -r "echo (extension_loaded('opcache') && opcache_get_status()['opcache_enabled']) ? 'Enabled' : 'Disabled'; echo PHP_EOL;"

# 10. Disk Usage in Containers
echo ""
print_status "💿 Container Disk Usage:"
echo "-----------------------"
echo "App container storage:"
docker compose exec app df -h /var/www 2>/dev/null || echo "Could not check app storage"

echo ""
echo "MySQL container storage:"
docker compose exec mysql df -h /var/lib/mysql 2>/dev/null || echo "Could not check MySQL storage"

# 11. Network Connectivity
echo ""
print_status "🌐 Network Connectivity:"
echo "-----------------------"
echo "App -> MySQL connection:"
if docker compose exec app ping -c 1 mysql >/dev/null 2>&1; then
    print_success "App can reach MySQL"
else
    print_error "App cannot reach MySQL"
fi

echo "App -> Redis connection:"
if docker compose exec app ping -c 1 redis >/dev/null 2>&1; then
    print_success "App can reach Redis"
else
    print_error "App cannot reach Redis"
fi

# 12. Recommendations
echo ""
print_status "💡 Performance Recommendations:"
echo "------------------------------"

# Check memory usage
APP_MEMORY=$(docker stats --no-stream --format "{{.MemPerc}}" laravel-app 2>/dev/null | sed 's/%//')
if [ ! -z "$APP_MEMORY" ] && [ "$APP_MEMORY" -gt 80 ]; then
    print_warning "High memory usage in app container: ${APP_MEMORY}%"
    echo "  → Consider increasing container memory limit"
else
    print_success "App container memory usage is acceptable"
fi

# Check if OpCache is working
if docker compose exec app php -r "exit(extension_loaded('opcache') && opcache_get_status()['opcache_enabled'] ? 0 : 1);" 2>/dev/null; then
    print_success "OpCache is enabled and working"
else
    print_warning "OpCache is not working properly"
    echo "  → Check php-production.ini configuration"
fi

# Check for high response times
if command -v bc >/dev/null 2>&1; then
    if [ "$JADWAL_TIME" != "FAILED" ] && [ $(echo "$JADWAL_TIME > 1.0" | bc -l) -eq 1 ]; then
        print_warning "Jadwal page response time is high: ${JADWAL_TIME}s"
        echo "  → Consider implementing caching or optimizing queries"
    fi

    if [ "$USERS_TIME" != "FAILED" ] && [ $(echo "$USERS_TIME > 1.0" | bc -l) -eq 1 ]; then
        print_warning "Users page response time is high: ${USERS_TIME}s"
        echo "  → Consider implementing pagination or caching"
    fi
fi

echo ""
print_status "🔍 Continuous Monitoring Commands:"
echo "---------------------------------"
echo "   docker compose logs -f app              # Follow app logs"
echo "   docker compose logs -f webserver        # Follow nginx logs"
echo "   docker stats                            # Live resource usage"
echo "   watch docker compose ps                 # Watch container status"
echo ""
print_status "🚀 Quick Actions:"
echo "----------------"
echo "   ./docker-quick-fix.sh                   # Quick fix for issues"
echo "   docker compose restart app              # Restart app container"
echo "   docker compose exec app php artisan cache:clear  # Clear cache"
echo "   docker compose exec app bash            # Access container shell"
echo ""
print_status "🎯 URLs:"
echo "-------"
echo "   Main App: ${BASE_URL}"
echo "   phpMyAdmin: http://localhost:8080"
