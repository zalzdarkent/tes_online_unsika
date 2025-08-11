# Docker Deployment Guide

## Quick Deployment Workflow

### 1. **Development → Production Deployment**

```bash
# Di local (development)
git add .
git commit -m "Fix 502 error and optimize performance"
git push origin main

# Di VPS server
cd /path/to/your/project
./quick-deploy.sh
```

### 2. **Step-by-Step Manual Process**

If you prefer manual control:

```bash
# 1. Backup database (optional)
docker-compose exec mysql mysqldump -u root -pTpFBSyz35Fmc2ALT sql_onlinetest > backup.sql

# 2. Pull latest code
git pull origin main

# 3. Rebuild containers
docker-compose down
docker-compose up -d --build

# 4. Run Laravel commands
docker-compose exec app composer install --optimize-autoloader --no-dev
docker-compose exec app php artisan migrate --force
docker-compose exec app php artisan config:cache
docker-compose exec app php artisan route:cache
docker-compose exec app php artisan queue:restart
```

## Deployment Scripts

### `quick-deploy.sh` - Simple One-Command Deployment
```bash
chmod +x quick-deploy.sh
./quick-deploy.sh
```

### `docker-deploy.sh` - Full Featured Deployment
```bash
chmod +x docker-deploy.sh

# Full deployment with rebuild
./docker-deploy.sh

# Quick deployment without rebuild
./docker-deploy.sh --no-build

# Force deployment without confirmation
./docker-deploy.sh --force
```

### `docker-manage.sh` - Container Management
```bash
chmod +x docker-manage.sh

# Check status
./docker-manage.sh status

# View logs
./docker-manage.sh logs app
./docker-manage.sh logs queue-worker

# Restart containers
./docker-manage.sh restart
./docker-manage.sh restart queue-worker

# Run artisan commands
./docker-manage.sh artisan queue:work
./docker-manage.sh artisan migrate:status
```

## Container Services

### Main Services:
- **app**: Laravel application (PHP-FPM)
- **webserver**: Nginx web server
- **mysql**: MySQL database
- **redis**: Redis cache/queue driver
- **queue-worker**: Background job processor
- **scheduler**: Laravel task scheduler

### Service Management:
```bash
# Start specific service
docker-compose up -d app

# Stop specific service
docker-compose stop queue-worker

# Restart specific service
docker-compose restart app

# View service logs
docker-compose logs -f app
```

## Troubleshooting

### Common Issues:

#### 1. **Containers not starting**
```bash
# Check container status
docker-compose ps

# Check logs for errors
docker-compose logs app

# Rebuild if needed
docker-compose build --no-cache
docker-compose up -d
```

#### 2. **Database connection errors**
```bash
# Check MySQL container
docker-compose logs mysql

# Test database connection
docker-compose exec app php artisan tinker
>>> DB::connection()->getPdo();
```

#### 3. **Permission errors**
```bash
# Fix Laravel permissions
docker-compose exec app chown -R www-data:www-data storage bootstrap/cache
docker-compose exec app chmod -R 775 storage bootstrap/cache
```

#### 4. **Queue jobs not processing**
```bash
# Check queue worker
docker-compose logs queue-worker

# Restart queue worker
docker-compose restart queue-worker

# Manual queue processing
docker-compose exec app php artisan queue:work
```

#### 5. **502 Bad Gateway errors**
```bash
# Check nginx logs
docker-compose logs webserver

# Check PHP-FPM logs
docker-compose logs app

# Check if app container is running
docker-compose ps app
```

### Performance Monitoring:
```bash
# Monitor resource usage
docker stats

# Monitor specific container
docker stats laravel-app

# Check system resources
htop
df -h
```

## Environment Configuration

### Required Files:
- `.env` - Laravel environment configuration
- `docker-compose.yml` - Docker services configuration
- `Dockerfile` - PHP application container

### Environment Variables:
```env
# Database
DB_CONNECTION=mysql
DB_HOST=mysql
DB_PORT=3306
DB_DATABASE=sql_onlinetest
DB_USERNAME=sql_onlinetest
DB_PASSWORD=TpFBSyz35Fmc2ALT

# Cache & Queue
CACHE_DRIVER=redis
QUEUE_CONNECTION=redis
SESSION_DRIVER=redis

# Redis
REDIS_HOST=redis
REDIS_PASSWORD=null
REDIS_PORT=6379
```

## Security Considerations

### Production Checklist:
- [ ] Change default database passwords
- [ ] Use environment variables for sensitive data
- [ ] Enable HTTPS with SSL certificates
- [ ] Configure firewall rules
- [ ] Regular security updates
- [ ] Monitor logs for suspicious activity

### SSL/HTTPS Setup:
```bash
# Using Certbot with Docker
docker run -it --rm \
  -v /etc/letsencrypt:/etc/letsencrypt \
  -v /var/www/certbot:/var/www/certbot \
  certbot/certbot certonly --webroot \
  --webroot-path=/var/www/certbot \
  -d your-domain.com
```

## Backup Strategy

### Database Backup:
```bash
# Create backup
docker-compose exec mysql mysqldump -u root -pTpFBSyz35Fmc2ALT sql_onlinetest > backup_$(date +%Y%m%d).sql

# Restore backup
docker-compose exec -T mysql mysql -u root -pTpFBSyz35Fmc2ALT sql_onlinetest < backup.sql
```

### Application Backup:
```bash
# Backup uploads and storage
tar -czf storage_backup_$(date +%Y%m%d).tar.gz storage/app/public

# Backup complete application
tar -czf app_backup_$(date +%Y%m%d).tar.gz --exclude=node_modules --exclude=vendor .
```

## Monitoring & Logs

### Log Locations:
```bash
# Laravel logs
docker-compose exec app tail -f storage/logs/laravel.log

# Nginx access logs
docker-compose logs webserver

# Queue worker logs
docker-compose logs queue-worker

# All services
docker-compose logs -f
```

### Health Checks:
```bash
# Application health
docker-compose exec app php artisan about

# Database health
docker-compose exec app php artisan migrate:status

# Queue health
docker-compose exec app php artisan queue:monitor
```
