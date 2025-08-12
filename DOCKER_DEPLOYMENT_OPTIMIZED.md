# Docker Deployment Guide - Optimized Performance

## 📋 Overview

Panduan ini menjelaskan cara men-deploy aplikasi Laravel dengan Docker yang telah dioptimasi untuk mengatasi masalah 502 Bad Gateway dan performa yang lambat (730ms+).

## 🔧 Optimasi yang Diimplementasikan

### 1. **PHP Configuration** (`php-production.ini`)
- Memory limit: 256M
- Max execution time: 120s
- OpCache enabled untuk performa
- Realpath cache optimized
- Upload limits yang sesuai

### 2. **PHP-FPM Configuration** (`docker/php-fpm-optimized.conf`)
- Process management: dynamic
- Max children: 20
- Request timeout: 120s
- Memory per process: 256M

### 3. **Nginx Configuration** (`docker/nginx-optimized.conf`)
- FastCGI timeouts: 180s
- Buffer sizes optimized
- Gzip compression enabled
- Static file caching

### 4. **Laravel Application Optimizations**
- Cache middleware untuk response caching
- Job dispatch frequency control
- User pagination (50 per page)
- Database query optimization

## 🚀 Quick Start

### 1. **Deployment Lengkap**
```bash
./docker-deploy.sh
```

### 2. **Deployment Tanpa Rebuild**
```bash
./docker-deploy.sh --no-build
```

### 3. **Force Deployment**
```bash
./docker-deploy.sh --force
```

## 🛠️ Files yang Dioptimasi

### **Docker Configuration:**
- `docker-compose.yml` - Updated dengan konfigurasi production
- `Dockerfile` - Include semua optimasi PHP
- `php-production.ini` - Konfigurasi PHP optimal
- `docker/php-fpm-optimized.conf` - PHP-FPM settings
- `docker/nginx-optimized.conf` - Nginx settings untuk Docker

### **Laravel Application:**
- `app/Http/Controllers/JadwalController.php` - Cache job dispatch
- `app/Http/Controllers/UserController.php` - Pagination implemented
- `app/Http/Middleware/CacheResponse.php` - Response caching
- `routes/web.php` - Cache middleware applied

### **Deployment Scripts:**
- `docker-deploy.sh` - Full deployment script
- `docker-quick-fix.sh` - Quick fix untuk 502 errors
- `docker-monitor.sh` - Performance monitoring

## 📊 Monitoring & Troubleshooting

### **Performance Monitoring**
```bash
./docker-monitor.sh
```

### **Quick Fix untuk 502 Errors**
```bash
./docker-quick-fix.sh
```

### **Check Container Status**
```bash
docker compose ps
docker compose logs -f app
```

### **Monitor Resource Usage**
```bash
docker stats
```

## 🔍 Troubleshooting Common Issues

### **502 Bad Gateway**
1. Run quick fix: `./docker-quick-fix.sh`
2. Check container logs: `docker compose logs app`
3. Restart containers: `docker compose restart`

### **High Memory Usage**
1. Check memory: `docker stats`
2. Increase container limits in `docker-compose.yml`
3. Optimize Laravel cache: `docker compose exec app php artisan cache:clear`

### **Slow Response Times**
1. Check OpCache: `docker compose exec app php -m | grep opcache`
2. Monitor logs: `docker compose logs -f app`
3. Check database queries: Monitor Laravel debug log

### **Database Connection Issues**
1. Check MySQL container: `docker compose logs mysql`
2. Test connection: `docker compose exec app php artisan tinker`
3. Restart MySQL: `docker compose restart mysql`

## 📈 Performance Expectations

### **Before Optimization:**
- Jadwal page: ~730ms
- Users page: ~730ms
- Frequent 502 errors

### **After Optimization:**
- Jadwal page: <300ms (with cache: <100ms)
- Users page: <200ms (with pagination)
- 502 errors: Eliminated
- Memory usage: Stable
- OpCache hit ratio: >90%

## 🔄 Deployment Process

### **Automated Steps:**
1. **Backup**: Database backup automatically created
2. **Code Update**: Git pull latest changes
3. **Container Build**: Optimized Docker images
4. **Service Start**: All containers with optimized configs
5. **Laravel Optimization**: Cache, routes, configs
6. **Health Check**: Verify all services working
7. **Performance Test**: Test critical endpoints

### **Manual Verification:**
```bash
# Check application
curl -I http://localhost/

# Check problematic endpoints
curl -I http://localhost/jadwal
curl -I http://localhost/users

# Monitor performance
./docker-monitor.sh
```

## 🌐 Production URLs

- **Main Application**: `http://your-domain.com`
- **phpMyAdmin**: `http://your-domain.com:8080`

## 📚 Useful Commands

### **Container Management:**
```bash
docker compose up -d                    # Start all services
docker compose down                     # Stop all services
docker compose restart app              # Restart app container
docker compose logs -f app              # Follow app logs
```

### **Laravel Commands:**
```bash
docker compose exec app php artisan cache:clear
docker compose exec app php artisan config:cache
docker compose exec app php artisan queue:work
docker compose exec app bash            # Access container shell
```

### **Database Operations:**
```bash
docker compose exec mysql mysql -u root -p
docker compose exec app php artisan migrate
docker compose exec app php artisan db:seed
```

### **Performance Monitoring:**
```bash
docker stats                            # Live resource usage
docker compose exec app php artisan about
docker compose exec app php -i | grep opcache
```

## 🔐 Security Considerations

1. **Environment Variables**: Ensure `.env` is properly configured
2. **Database Passwords**: Use strong passwords
3. **File Permissions**: Proper permissions set in containers
4. **SSL/TLS**: Configure HTTPS for production
5. **Firewall**: Limit port access

## 📝 Maintenance

### **Regular Tasks:**
- Monitor container logs: `docker compose logs`
- Check disk usage: `docker system df`
- Update dependencies: `docker compose exec app composer update`
- Database backup: Automated in deployment script

### **Monthly Tasks:**
- Clean Docker system: `docker system prune -a`
- Update base images: Rebuild containers
- Review performance metrics
- Update security patches

## 🆘 Emergency Procedures

### **Complete System Restart:**
```bash
docker compose down
docker system prune -f
./docker-deploy.sh --force
```

### **Database Recovery:**
```bash
# Restore from backup
docker compose exec mysql mysql -u root -p sql_onlinetest < backup_file.sql
```

### **Roll Back Deployment:**
```bash
git checkout HEAD~1
./docker-deploy.sh --force
```

## 📞 Support

Untuk masalah atau pertanyaan:
1. Check logs: `./docker-monitor.sh`
2. Try quick fix: `./docker-quick-fix.sh`
3. Review troubleshooting section
4. Contact system administrator

---

**Catatan**: Pastikan Docker dan Docker Compose sudah terinstall sebelum menjalankan deployment.
