# Gunakan PHP FPM sebagai base
FROM php:8.2-fpm

# Install dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    libpng-dev \
    libjpeg-dev \
    libonig-dev \
    libxml2-dev \
    zip unzip curl git \
    nodejs npm \
    vim

# Install PHP extensions
RUN docker-php-ext-install pdo_mysql mbstring exif pcntl bcmath gd

# Install Composer (gunakan image resmi composer)
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

# Set working directory
WORKDIR /var/www

# Copy project files into container
COPY . .

# Copy .env file if you need it inside build context
# COPY .env .env

# Install PHP dependencies
RUN composer install --no-dev --optimize-autoloader

# Set correct permissions BEFORE artisan command
RUN chown -R www-data:www-data /var/www \
 && chmod -R 775 /var/www/storage /var/www/bootstrap/cache

# Laravel commands
RUN php artisan storage:link \
 && php artisan config:clear \
 && php artisan config:cache \
 && php artisan route:cache \
 && php artisan view:cache

# Build frontend
RUN npm install \
 && npm run build

# Final CMD
CMD ["php-fpm"]
