# Gunakan PHP FPM sebagai base
FROM php:8.2-fpm

# Install dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    libpng-dev \
    libjpeg-dev \
    libonig-dev \
    libxml2-dev \
    libzip-dev \
    zip unzip curl git \
    nodejs npm \
    vim \
    supervisor \
    && rm -rf /var/lib/apt/lists/*

# Install PHP extensions yang diperlukan untuk Laravel
RUN docker-php-ext-install pdo_mysql mbstring exif pcntl bcmath gd zip

# Enable OpCache untuk performa
RUN docker-php-ext-enable opcache

# Install Redis extension
RUN pecl install redis && docker-php-ext-enable redis

# Install Composer (gunakan image resmi composer)
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

# Copy konfigurasi PHP production
COPY php-production.ini /usr/local/etc/php/conf.d/

# Copy konfigurasi PHP-FPM yang dioptimasi
COPY docker/php-fpm-optimized.conf /usr/local/etc/php-fpm.d/www.conf

# Set working directory
WORKDIR /var/www

# Copy project files into container
COPY . .

# Install PHP dependencies untuk production
RUN composer install --no-dev --optimize-autoloader --no-interaction

# Set correct permissions BEFORE artisan command
RUN chown -R www-data:www-data /var/www \
 && chmod -R 775 /var/www/storage /var/www/bootstrap/cache

# Install npm dependencies dan build assets
RUN npm ci --production=false \
 && npm run build \
 && npm cache clean --force

# Laravel optimization commands
RUN php artisan storage:link \
 && php artisan config:clear \
 && php artisan config:cache \
 && php artisan route:cache \
 && php artisan view:cache

# Create log directory untuk PHP errors
RUN mkdir -p /var/log && touch /var/log/php_errors.log \
 && chown www-data:www-data /var/log/php_errors.log

# Final CMD
CMD ["php-fpm"]
