#!/bin/bash

# Quick Fix untuk 502 Bad Gateway Errors
# Script ini akan melakukan langkah-langkah perbaikan cepat

echo "🚨 502 Bad Gateway Quick Fix"
echo "============================"

# 1. Clear all Laravel caches
echo "🧹 Clearing Laravel caches..."
php artisan cache:clear
php artisan config:clear
php artisan route:clear
php artisan view:clear
echo "✅ Laravel caches cleared"

# 2. Restart PHP-FPM
echo "🔄 Restarting PHP-FPM..."
sudo systemctl restart php8.2-fpm
sleep 2

# Check PHP-FPM status
if sudo systemctl is-active --quiet php8.2-fpm; then
    echo "✅ PHP-FPM restarted successfully"
else
    echo "❌ PHP-FPM restart failed"
    sudo systemctl status php8.2-fpm --no-pager
fi

# 3. Restart Nginx
echo "🔄 Restarting Nginx..."
sudo nginx -t
if [ $? -eq 0 ]; then
    sudo systemctl restart nginx
    echo "✅ Nginx restarted successfully"
else
    echo "❌ Nginx configuration error"
    sudo nginx -t
fi

# 4. Check socket permissions
echo "🔐 Checking socket permissions..."
if [ -S /run/php/php8.2-fpm.sock ]; then
    sudo chmod 666 /run/php/php8.2-fpm.sock
    echo "✅ Socket permissions fixed"
else
    echo "❌ PHP-FPM socket not found"
fi

# 5. Restart queue workers
echo "⚡ Restarting queue workers..."
# Kill existing queue workers
pkill -f "queue:work"
sleep 2

# Start new queue worker in background
nohup php artisan queue:work --daemon --sleep=3 --tries=3 > storage/logs/queue.log 2>&1 &
echo "✅ Queue worker restarted"

# 6. Check disk space
echo "💾 Checking disk space..."
DISK_USAGE=$(df / | tail -1 | awk '{print $5}' | sed 's/%//')
if [ "$DISK_USAGE" -gt 90 ]; then
    echo "⚠️  Disk usage high: ${DISK_USAGE}%"
    # Clear old logs
    find storage/logs/ -name "*.log" -mtime +7 -delete
    echo "✅ Old logs cleaned"
else
    echo "✅ Disk space OK: ${DISK_USAGE}%"
fi

# 7. Optimize for performance
echo "⚡ Optimizing for performance..."
php artisan config:cache
php artisan route:cache
php artisan view:cache
echo "✅ Performance optimizations applied"

# 8. Test the endpoints that had 502 errors
echo "🧪 Testing problematic endpoints..."

# Test jadwal
echo "Testing /jadwal..."
HTTP_CODE=$(curl -o /dev/null -s -w "%{http_code}" http://localhost/jadwal 2>/dev/null || echo "000")
if [ "$HTTP_CODE" = "200" ]; then
    echo "✅ /jadwal is working (HTTP $HTTP_CODE)"
else
    echo "❌ /jadwal still has issues (HTTP $HTTP_CODE)"
fi

# Test users
echo "Testing /users..."
HTTP_CODE=$(curl -o /dev/null -s -w "%{http_code}" http://localhost/users 2>/dev/null || echo "000")
if [ "$HTTP_CODE" = "200" ]; then
    echo "✅ /users is working (HTTP $HTTP_CODE)"
else
    echo "❌ /users still has issues (HTTP $HTTP_CODE)"
fi

# 9. Monitor for a few seconds
echo "👀 Monitoring for 10 seconds..."
timeout 10 tail -f /var/log/nginx/error.log &
TAIL_PID=$!
sleep 10
kill $TAIL_PID 2>/dev/null

echo ""
echo "🎯 Fix completed!"
echo "=================="
echo ""
echo "📊 If problems persist, check:"
echo "   1. tail -f /var/log/nginx/error.log"
echo "   2. tail -f storage/logs/laravel.log"
echo "   3. sudo tail -f /var/log/php8.2-fpm-slow.log"
echo ""
echo "🔧 Advanced fixes:"
echo "   ./deploy-optimized.sh    # Full optimization deployment"
echo "   ./monitor-performance.sh # Detailed performance monitoring"
