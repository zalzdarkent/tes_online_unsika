#!/bin/bash

# Production Deployment Script dengan Optimasi Performa
# Script ini akan mengoptimalkan konfigurasi PHP dan Nginx

echo "🚀 Starting optimized production deployment..."

# 1. Update aplikasi
echo "📦 Updating application..."
git pull origin main
composer install --no-dev --optimize-autoloader

# 2. Clear dan optimize cache
echo "🧹 Clearing and optimizing cache..."
php artisan cache:clear
php artisan config:clear
php artisan route:clear
php artisan view:clear

# 3. Optimize untuk production
echo "⚡ Optimizing for production..."
php artisan config:cache
php artisan route:cache
php artisan view:cache

# 4. Update PHP configuration
echo "🔧 Updating PHP configuration..."
if [ -f "php-production.ini" ]; then
    # Backup existing php.ini
    sudo cp /etc/php/8.2/fpm/php.ini /etc/php/8.2/fpm/php.ini.backup.$(date +%Y%m%d_%H%M%S)

    # Apply production settings
    echo "Applying PHP production settings..."

    # Memory dan execution time
    sudo sed -i 's/memory_limit = .*/memory_limit = 256M/' /etc/php/8.2/fpm/php.ini
    sudo sed -i 's/max_execution_time = .*/max_execution_time = 120/' /etc/php/8.2/fpm/php.ini
    sudo sed -i 's/max_input_time = .*/max_input_time = 60/' /etc/php/8.2/fpm/php.ini

    # Upload settings
    sudo sed -i 's/upload_max_filesize = .*/upload_max_filesize = 50M/' /etc/php/8.2/fpm/php.ini
    sudo sed -i 's/post_max_size = .*/post_max_size = 50M/' /etc/php/8.2/fpm/php.ini

    # OpCache settings
    sudo sed -i 's/;opcache.enable=.*/opcache.enable=1/' /etc/php/8.2/fpm/php.ini
    sudo sed -i 's/;opcache.memory_consumption=.*/opcache.memory_consumption=128/' /etc/php/8.2/fpm/php.ini
    sudo sed -i 's/;opcache.max_accelerated_files=.*/opcache.max_accelerated_files=4000/' /etc/php/8.2/fpm/php.ini

    echo "✅ PHP configuration updated"
fi

# 5. Update PHP-FPM configuration
echo "🔧 Updating PHP-FPM configuration..."
if [ -f "docker/php-fpm-optimized.conf" ]; then
    sudo cp docker/php-fpm-optimized.conf /etc/php/8.2/fpm/pool.d/www.conf
    echo "✅ PHP-FPM configuration updated"
fi

# 6. Update Nginx configuration
echo "🔧 Updating Nginx configuration..."
if [ -f "docker/nginx-optimized.conf" ]; then
    # Backup existing config
    sudo cp /etc/nginx/sites-available/default /etc/nginx/sites-available/default.backup.$(date +%Y%m%d_%H%M%S)

    # Update dengan konfigurasi optimized
    sudo cp docker/nginx-optimized.conf /etc/nginx/sites-available/default

    # Test nginx configuration
    if sudo nginx -t; then
        echo "✅ Nginx configuration updated"
    else
        echo "❌ Nginx configuration error, reverting..."
        sudo cp /etc/nginx/sites-available/default.backup.$(date +%Y%m%d_%H%M%S) /etc/nginx/sites-available/default
    fi
fi

# 7. Restart services
echo "🔄 Restarting services..."
sudo systemctl reload php8.2-fpm
sudo systemctl reload nginx

# 8. Setup queue worker jika belum ada
echo "⚙️ Setting up queue worker..."
if ! pgrep -f "queue:work" > /dev/null; then
    nohup php artisan queue:work --daemon --sleep=3 --tries=3 > storage/logs/queue.log 2>&1 &
    echo "✅ Queue worker started"
fi

# 9. Setup cron job untuk scheduled tasks
echo "⏰ Setting up cron job..."
(crontab -l 2>/dev/null; echo "* * * * * cd $(pwd) && php artisan schedule:run >> /dev/null 2>&1") | crontab -

# 10. Set permissions
echo "🔐 Setting permissions..."
chmod -R 755 storage bootstrap/cache
chown -R www-data:www-data storage bootstrap/cache

# 11. Run migrations (jika ada)
echo "🗄️ Running migrations..."
php artisan migrate --force

echo "✅ Deployment completed successfully!"
echo ""
echo "📊 Performance monitoring commands:"
echo "   Monitor PHP-FPM: sudo tail -f /var/log/php8.2-fpm-slow.log"
echo "   Monitor Nginx: sudo tail -f /var/log/nginx/error.log"
echo "   Monitor Laravel: tail -f storage/logs/laravel.log"
echo "   Monitor Queue: tail -f storage/logs/queue.log"
echo ""
echo "🎯 Next steps:"
echo "   1. Test the application: curl -I http://your-domain.com"
echo "   2. Monitor performance for 502 errors"
echo "   3. Check queue worker status: ps aux | grep queue:work"
