# VPS Deployment Guide - Optimized Performance

## 🎯 Quick Deployment Steps

### 1. **Push ke GitHub (dari local)**
```bash
# Commit semua perubahan optimasi
git add .
git commit -m "feat: optimize performance and fix 502 bad gateway errors

- Add PHP production configuration (php-production.ini)
- Optimize JadwalController with cache job dispatch  
- Add pagination to UserController
- Add response cache middleware
- Update Docker configurations for production
- Add VPS deployment scripts"

git push origin main
```

### 2. **Pull dan Update di VPS**
```bash
# SSH ke VPS
ssh your-user@your-vps-ip

# Navigate ke project directory
cd /path/to/your/project

# Pull latest optimizations
git pull origin main

# Run optimized update (zero downtime)
chmod +x vps-update.sh
./vps-update.sh
```

## 🐳 Docker Commands untuk VPS

### **Container Management (tanpa dash):**
```bash
# Status containers
docker compose ps

# View logs
docker compose logs -f app
docker compose logs -f webserver

# Restart specific service
docker compose restart app
docker compose restart webserver

# Stop/Start all
docker compose down
docker compose up -d
```

### **Laravel Commands:**
```bash
# Clear cache
docker compose exec app php artisan cache:clear

# Optimize for production
docker compose exec app php artisan config:cache
docker compose exec app php artisan route:cache
docker compose exec app php artisan view:cache

# Run migrations
docker compose exec app php artisan migrate --force

# Queue management
docker compose exec app php artisan queue:work
docker compose exec app php artisan queue:restart
```

## 🚀 Available Scripts

### **For VPS Update (Recommended):**
```bash
./vps-update.sh           # Zero-downtime update dengan backup
```

### **For Monitoring:**
```bash
./docker-monitor.sh       # Performance monitoring
```

### **For Quick Fixes:**
```bash
./docker-quick-fix.sh     # Quick fix untuk 502 errors
```

### **For Full Deployment:**
```bash
./docker-deploy.sh        # Full deployment (dengan downtime)
```

## 📊 Expected Performance After Update

### **Before Optimization:**
- ❌ Jadwal page: ~730ms
- ❌ Users page: ~730ms  
- ❌ Frequent 502 Bad Gateway errors
- ❌ High memory usage
- ❌ No caching

### **After Optimization:**
- ✅ Jadwal page: <300ms (with cache: <100ms)
- ✅ Users page: <200ms (with pagination)
- ✅ No 502 errors
- ✅ Stable memory usage with OpCache
- ✅ Response caching implemented
- ✅ Background job optimization

## 🔧 Key Optimizations Implemented

### **1. PHP Configuration (`php-production.ini`):**
- Memory limit: 256M
- Execution time: 120s
- OpCache enabled: 128M
- Realpath cache: 4096K

### **2. Laravel Application:**
- **JadwalController**: Cache job dispatch (1 hour interval)
- **UserController**: Pagination (50 users per page)
- **CacheResponse Middleware**: 3-5 minute caching
- **Routes**: Cache middleware applied to heavy endpoints

### **3. Docker Containers:**
- **PHP-FPM**: Process management optimized
- **Nginx**: FastCGI timeouts increased to 180s
- **OpCache**: Enabled with optimal settings
- **Redis**: For caching and sessions

### **4. Database Queries:**
- Selective field loading with `select()`
- Optimized relationships loading
- Background job for expired jadwal updates

## 🛠️ Troubleshooting

### **If 502 Errors Still Occur:**
```bash
# Quick fix
./docker-quick-fix.sh

# Check logs
docker compose logs app | grep -i error
docker compose logs webserver | grep -i error

# Restart services
docker compose restart app webserver
```

### **If Performance is Still Slow:**
```bash
# Check resource usage
docker stats

# Monitor performance
./docker-monitor.sh

# Check OpCache status
docker compose exec app php -i | grep opcache
```

### **If Database Issues:**
```bash
# Check MySQL
docker compose logs mysql

# Test connection
docker compose exec app php artisan tinker
> DB::connection()->getPdo();

# Restart database
docker compose restart mysql
```

## 📈 Monitoring Commands

### **Real-time Monitoring:**
```bash
# Live container stats
docker stats

# Follow app logs
docker compose logs -f app

# Monitor nginx access
docker compose logs -f webserver | grep -v "GET.*\.css\|GET.*\.js\|GET.*\.png"

# Performance monitoring
watch -n 5 './docker-monitor.sh'
```

### **Performance Testing:**
```bash
# Test response times
curl -w "%{time_total}s\n" -o /dev/null -s http://your-domain.com/
curl -w "%{time_total}s\n" -o /dev/null -s http://your-domain.com/jadwal
curl -w "%{time_total}s\n" -o /dev/null -s http://your-domain.com/users
```

## 🔐 Security Notes

### **Environment Variables:**
Pastikan `.env` di VPS memiliki:
```env
APP_ENV=production
APP_DEBUG=false
DB_HOST=mysql
REDIS_HOST=redis
CACHE_DRIVER=redis
SESSION_DRIVER=redis
QUEUE_CONNECTION=redis
```

### **File Permissions:**
```bash
# Set correct permissions
docker compose exec app chown -R www-data:www-data storage bootstrap/cache
docker compose exec app chmod -R 775 storage bootstrap/cache
```

## 🚨 Emergency Procedures

### **Complete System Recovery:**
```bash
# Stop all containers
docker compose down

# Clean Docker system
docker system prune -a -f

# Full redeployment
./docker-deploy.sh --force
```

### **Rollback to Previous Version:**
```bash
# Rollback code
git reset --hard HEAD~1

# Rebuild containers
docker compose down
docker compose up -d --build
```

### **Database Recovery:**
```bash
# Restore from backup (if needed)
docker compose exec -T mysql mysql -u root -pTpFBSyz35Fmc2ALT sql_onlinetest < backup_file.sql
```

## 📱 Quick Access URLs

```bash
# Get server IP
SERVER_IP=$(curl -s ifconfig.me)

# Application URLs
echo "Main App: http://${SERVER_IP}"
echo "phpMyAdmin: http://${SERVER_IP}:8080"
echo "Direct IP access: http://$(docker compose port webserver 80)"
```

## 📞 Support Commands

```bash
# System info
docker compose exec app php artisan about

# Check optimizations
docker compose exec app php -i | grep -E "memory_limit|max_execution_time|opcache"

# Database status
docker compose exec mysql mysql -u root -pTpFBSyz35Fmc2ALT -e "SHOW PROCESSLIST;"

# Queue status
docker compose exec app php artisan queue:failed
```

---

## 🎉 Deployment Checklist

- [ ] Code pushed to GitHub
- [ ] SSH ke VPS berhasil
- [ ] `git pull origin main` berhasil
- [ ] `./vps-update.sh` berjalan tanpa error
- [ ] Health check passed
- [ ] Performance test < 500ms
- [ ] No 502 errors
- [ ] Monitor logs untuk 5 menit pertama

**Selamat! Aplikasi Anda sekarang dioptimasi dan siap untuk production! 🚀**
