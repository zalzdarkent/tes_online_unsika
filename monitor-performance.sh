#!/bin/bash

# Performance Monitoring Script
# Script untuk monitoring performa aplikasi Laravel

echo "🔍 Laravel Performance Monitor"
echo "=================================="

# 1. Check PHP-FPM Status
echo ""
echo "📊 PHP-FPM Status:"
echo "------------------"
sudo systemctl status php8.2-fpm --no-pager -l

# 2. Check PHP-FPM Pool Status
echo ""
echo "🏊 PHP-FPM Pool Status:"
echo "----------------------"
if [ -S /run/php/php8.2-fpm.sock ]; then
    echo "✅ PHP-FPM socket is active"
else
    echo "❌ PHP-FPM socket not found"
fi

# 3. Check Memory Usage
echo ""
echo "💾 Memory Usage:"
echo "---------------"
free -h

# 4. Check Recent 502 Errors in Nginx
echo ""
echo "🚨 Recent 502 Errors (last 100 lines):"
echo "---------------------------------------"
sudo tail -100 /var/log/nginx/error.log | grep "502\|upstream" | tail -10

# 5. Check PHP Slow Log
echo ""
echo "🐌 PHP Slow Queries (last 10):"
echo "------------------------------"
if [ -f "/var/log/php8.2-fpm-slow.log" ]; then
    sudo tail -20 /var/log/php8.2-fpm-slow.log
else
    echo "No slow log found"
fi

# 6. Check Laravel Log Errors
echo ""
echo "📝 Laravel Recent Errors:"
echo "------------------------"
if [ -f "storage/logs/laravel.log" ]; then
    tail -20 storage/logs/laravel.log | grep -i "error\|exception\|fatal" | tail -5
else
    echo "No Laravel log found"
fi

# 7. Check Queue Status
echo ""
echo "⚡ Queue Worker Status:"
echo "---------------------"
ps aux | grep -E "(queue:work|artisan)" | grep -v grep

# 8. Check Cache Status
echo ""
echo "🗄️ Cache Status:"
echo "---------------"
php artisan cache:table 2>/dev/null || echo "Cache table not configured"

# 9. Test Response Time untuk halaman bermasalah
echo ""
echo "⏱️ Response Time Test:"
echo "--------------------"

# Test jadwal endpoint
echo "Testing /jadwal endpoint..."
JADWAL_TIME=$(curl -o /dev/null -s -w "%{time_total}\n" -H "User-Agent: Mozilla/5.0" http://localhost/jadwal 2>/dev/null || echo "FAILED")
echo "Jadwal page: ${JADWAL_TIME}s"

# Test users endpoint
echo "Testing /users endpoint..."
USERS_TIME=$(curl -o /dev/null -s -w "%{time_total}\n" -H "User-Agent: Mozilla/5.0" http://localhost/users 2>/dev/null || echo "FAILED")
echo "Users page: ${USERS_TIME}s"

# Test koreksi endpoint
echo "Testing /koreksi endpoint..."
KOREKSI_TIME=$(curl -o /dev/null -s -w "%{time_total}\n" -H "User-Agent: Mozilla/5.0" http://localhost/koreksi 2>/dev/null || echo "FAILED")
echo "Koreksi page: ${KOREKSI_TIME}s"

# 10. Recommendations
echo ""
echo "💡 Recommendations:"
echo "------------------"

# Check if OpCache is enabled
PHP_OPCACHE=$(php -m | grep -i opcache)
if [ -z "$PHP_OPCACHE" ]; then
    echo "❌ OpCache not enabled - Enable it for better performance"
else
    echo "✅ OpCache is enabled"
fi

# Check if queue workers are running
QUEUE_WORKERS=$(ps aux | grep -c "queue:work")
if [ "$QUEUE_WORKERS" -lt 2 ]; then
    echo "⚠️  Consider running more queue workers for better performance"
else
    echo "✅ Queue workers are running"
fi

# Check memory usage
MEMORY_USAGE=$(free | grep Mem | awk '{printf "%.0f", $3/$2 * 100.0}')
if [ "$MEMORY_USAGE" -gt 80 ]; then
    echo "⚠️  High memory usage: ${MEMORY_USAGE}% - Consider upgrading server"
else
    echo "✅ Memory usage is acceptable: ${MEMORY_USAGE}%"
fi

echo ""
echo "🎯 Quick Fixes for 502 Errors:"
echo "------------------------------"
echo "1. sudo systemctl restart php8.2-fpm"
echo "2. sudo systemctl restart nginx"
echo "3. php artisan cache:clear"
echo "4. php artisan queue:restart"
echo "5. Check: tail -f storage/logs/laravel.log"

echo ""
echo "📈 For detailed monitoring, run:"
echo "   sudo tail -f /var/log/nginx/error.log"
echo "   sudo tail -f /var/log/php8.2-fpm-slow.log"
echo "   tail -f storage/logs/laravel.log"
