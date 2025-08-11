#!/bin/bash

# Production Deployment Script for Laravel App
# Run this script after git pull to optimize for production

echo "🚀 Starting Laravel Production Deployment..."

# Clear and optimize caches
echo "📦 Clearing and optimizing caches..."
php artisan config:clear
php artisan route:clear
php artisan view:clear
php artisan cache:clear

# Optimize for production
echo "⚡ Optimizing for production..."
php artisan config:cache
php artisan route:cache
php artisan view:cache

# Update composer dependencies
echo "📚 Updating Composer dependencies..."
composer install --optimize-autoloader --no-dev

# Run database migrations (if needed)
echo "🗄️ Running database migrations..."
php artisan migrate --force

# Generate optimized class loader
echo "🏗️ Generating optimized autoloader..."
composer dump-autoload --optimize

# Set proper permissions
echo "🔐 Setting proper file permissions..."
chmod -R 755 storage
chmod -R 755 bootstrap/cache

# Queue worker restart (if using supervisor)
echo "🔄 Restarting queue workers..."
php artisan queue:restart

# Update scheduled commands
echo "⏰ Updating scheduled commands..."
php artisan schedule:run

echo "✅ Deployment completed successfully!"
echo "🔍 Check application status with: php artisan about"
