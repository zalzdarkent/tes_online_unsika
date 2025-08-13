# 🚀 VPS Production Update Guide

## 📋 Overview
Panduan ini untuk meng-update aplikasi di VPS yang sudah running dengan Docker, dengan optimasi performa untuk mengatasi 502 Bad Gateway dan response time tinggi.

## ⚡ Quick Update (Recommended)

### 1. **Push ke GitHub** (Sudah Done ✅)
```bash
# Di local machine (sudah dilakukan)
git add .
git commit -m "Optimize Docker deployment for 502 Bad Gateway fix"
git push origin main
```

### 2. **Update di VPS**
```bash
# SSH ke VPS
ssh user@your-vps-ip

# Masuk ke directory project
cd /path/to/tes_online_unsika

# Pull latest changes dan update
git pull origin main

# Make script executable
chmod +x vps-update.sh

# Run update script
./vps-update.sh
```

## 🔧 Manual Step-by-Step (Jika Script Gagal)

### **Step 1: Backup & Pull Code**
```bash
# Backup database (opsional)
docker compose exec -T mysql mysqldump -u root -pTpFBSyz35Fmc2ALT sql_onlinetest > backup_$(date +%Y%m%d).sql

# Pull latest code
git stash  # backup local changes
git pull origin main
```

### **Step 2: Update Docker Containers**
```bash
# Stop containers
docker compose down

# Build dengan konfigurasi baru
docker compose build --no-cache

# Start dengan optimasi
docker compose up -d
```

### **Step 3: Apply Laravel Optimizations**
```bash
# Clear caches
docker compose exec app php artisan config:clear
docker compose exec app php artisan cache:clear
docker compose exec app php artisan route:clear
docker compose exec app php artisan view:clear

# Update dependencies
docker compose exec app composer install --optimize-autoloader --no-dev

# Run migrations
docker compose exec app php artisan migrate --force

# Cache for production
docker compose exec app php artisan config:cache
docker compose exec app php artisan route:cache
docker compose exec app php artisan view:cache

# Fix permissions
docker compose exec app chown -R www-data:www-data /var/www/storage /var/www/bootstrap/cache
docker compose exec app chmod -R 775 /var/www/storage /var/www/bootstrap/cache
```

### **Step 4: Test & Monitor**
```bash
# Check container status
docker compose ps

# Test endpoints
curl -I http://your-domain.com
curl -I http://your-domain.com/jadwal
curl -I http://your-domain.com/users

# Monitor performance
./docker-monitor.sh
```

## 🎯 What's New in This Update

### **Performance Optimizations:**
- ✅ **PHP Production Config**: Memory 256M, OpCache enabled
- ✅ **Response Caching**: 3-5 menit cache untuk halaman berat
- ✅ **Job Optimization**: Cache job dispatch frequency
- ✅ **User Pagination**: 50 users per page instead of all
- ✅ **FastCGI Timeouts**: 180s timeout untuk request berat

### **Docker Improvements:**
- ✅ **PHP-FPM Config**: Optimized process management
- ✅ **Nginx Config**: Buffer sizes dan timeouts optimal
- ✅ **Container Networking**: Proper service communication
- ✅ **Resource Limits**: Appropriate memory dan CPU limits

### **New Scripts:**
- ✅ **`vps-update.sh`**: Automated VPS update script
- ✅ **`docker-quick-fix.sh`**: Quick fix untuk 502 errors
- ✅ **`docker-monitor.sh`**: Performance monitoring

## 📊 Expected Results

### **Before Update:**
- Jadwal page: ~730ms response time
- Users page: ~730ms response time
- Frequent 502 Bad Gateway errors
- High memory usage

### **After Update:**
- Jadwal page: <300ms (cached: <100ms)
- Users page: <200ms with pagination
- 502 errors: Eliminated
- Stable memory usage with OpCache
- Better resource utilization

## 🔍 Troubleshooting

### **If Update Fails:**
```bash
# Rollback to previous version
git reset --hard HEAD~1
docker compose down
docker compose up -d --build
```

### **If 502 Errors Still Occur:**
```bash
# Run quick fix
./docker-quick-fix.sh

# Manual fix
docker compose restart app
docker compose restart webserver
docker compose exec app php artisan cache:clear
```

### **If Containers Won't Start:**
```bash
# Check logs
docker compose logs app
docker compose logs webserver
docker compose logs mysql

# Reset containers
docker compose down --volumes
docker compose up -d --build
```

## 📱 Monitoring Commands

### **Real-time Monitoring:**
```bash
# Container status
docker compose ps

# Resource usage
docker stats

# Application logs
docker compose logs -f app

# Nginx logs
docker compose logs -f webserver

# Performance monitoring
./docker-monitor.sh
```

### **Health Checks:**
```bash
# Laravel health
docker compose exec app php artisan about

# Database connection
docker compose exec app php artisan tinker --execute="DB::connection()->getPdo();"

# Queue status
docker compose exec app php artisan queue:monitor
```

## 🌐 URLs After Update

- **Main Application**: `http://your-domain.com`
- **phpMyAdmin**: `http://your-domain.com:8080`
- **SSL**: Configure Nginx untuk HTTPS (jika belum)

## 🔄 Regular Maintenance

### **Weekly:**
```bash
# Monitor performance
./docker-monitor.sh

# Clean Docker resources
docker system prune -f

# Check logs for errors
docker compose logs app | grep -i error
```

### **Monthly:**
```bash
# Update dependencies
docker compose exec app composer update

# Database optimization
docker compose exec app php artisan optimize

# Security updates
apt update && apt upgrade
```

## 🆘 Emergency Contacts

### **If Website Down:**
1. Check containers: `docker compose ps`
2. Restart services: `docker compose restart`
3. Run quick fix: `./docker-quick-fix.sh`
4. Contact admin if still failing

### **Performance Issues:**
1. Monitor resources: `./docker-monitor.sh`
2. Check slow queries: `docker compose logs app`
3. Clear caches: `docker compose exec app php artisan cache:clear`

---

## 📞 Support Commands Cheat Sheet

```bash
# Quick status check
docker compose ps && docker stats --no-stream

# Quick fix for 502 errors
./docker-quick-fix.sh

# Full performance report
./docker-monitor.sh

# Emergency restart
docker compose restart

# View recent errors
docker compose logs --tail=50 app | grep -i error
```

**Note**: Pastikan backup database sebelum update untuk keamanan data.
