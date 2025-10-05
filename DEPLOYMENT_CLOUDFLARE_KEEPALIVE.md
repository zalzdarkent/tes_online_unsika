# Deployment Instructions: Cloudflare Session Keep-Alive

## 📋 Pre-Deployment Checklist

### 1. Environment Configuration
Update `.env` file di production:

```env
# Session Configuration untuk Cloudflare
SESSION_LIFETIME=960  # 16 jam
SESSION_SECURE_COOKIE=true  # Karena HTTPS
SESSION_DOMAIN=.onlinetest.unsika.ac.id  # Wildcard domain
SESSION_HTTP_ONLY=true
SESSION_SAME_SITE=lax
SESSION_EXPIRE_ON_CLOSE=false

# Optional: Untuk debugging di development
# SESSION_KEEP_ALIVE_DEBUG=true
```

### 2. Database Migration
Pastikan session table sudah optimal:

```bash
# Jalankan migrasi jika diperlukan
php artisan migrate

# Buat index untuk performance (optional, biasanya sudah ada)
php artisan db:seed --class=SessionTableOptimizationSeeder
```

### 3. Nginx Configuration
Update nginx config untuk pass Cloudflare headers:

```nginx
# Di dalam server block
location / {
    # Existing configuration...
    
    # Pass Cloudflare headers
    proxy_set_header CF-RAY $http_cf_ray;
    proxy_set_header CF-Connecting-IP $http_cf_connecting_ip;
    proxy_set_header CF-IPCountry $http_cf_ipcountry;
    proxy_set_header CF-Visitor $http_cf_visitor;
    
    # Standard headers
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```

## 🚀 Deployment Steps

### Step 1: Code Deployment
```bash
# 1. Pull latest code
git pull origin main

# 2. Install dependencies
composer install --optimize-autoloader --no-dev
npm install
npm run build

# 3. Clear caches
php artisan config:clear
php artisan cache:clear
php artisan route:clear
php artisan view:clear

# 4. Optimize for production
php artisan config:cache
php artisan route:cache
php artisan view:cache
```

### Step 2: Database Updates
```bash
# Run migrations if any
php artisan migrate --force

# Clear expired sessions before deployment
php artisan session:cleanup --hours=24
```

### Step 3: Test Session Keep-Alive
```bash
# Test session endpoints
curl -X GET https://onlinetest.unsika.ac.id/session-test
curl -X POST https://onlinetest.unsika.ac.id/keep-alive \
  -H "Content-Type: application/json" \
  -H "X-CSRF-TOKEN: your-token" \
  -d '{"timestamp": 1234567890}'

# Check session statistics
php artisan session:cleanup --stats
```

### Step 4: Monitor & Verify

#### Test dengan Browser
1. Login ke sistem
2. Buka `/session-test.html` untuk test tool
3. Jalankan auto test selama 10-15 menit
4. Verify tidak ada Cloudflare challenge

#### Test dengan Multiple Users
1. Login dengan beberapa akun peserta
2. Biarkan idle selama 5-10 menit
3. Akses menu sidebar
4. Pastikan tidak ada redirect ke Cloudflare verification

## 📊 Monitoring

### 1. Real-time Monitoring
```bash
# Monitor session keep-alive logs (di development)
tail -f storage/logs/laravel.log | grep "keep-alive"

# Monitor session count
watch -n 30 'php artisan session:cleanup --stats'
```

### 2. Daily Checks
```bash
# Jalankan setiap hari untuk monitoring
php artisan session:cleanup --stats

# Check for expired sessions
php artisan session:cleanup --dry-run --hours=24
```

### 3. Performance Monitoring
Monitor these metrics:
- Session table size
- Keep-alive request frequency
- User complaint about Cloudflare challenges
- Server response time untuk keep-alive endpoint

## 🔧 Configuration Tuning

### Interval Adjustment
Jika masih ada Cloudflare challenges, adjust interval di:

```typescript
// resources/js/hooks/use-session-keepalive.ts
const getDefaultInterval = () => {
    if (window.location.pathname.includes('/soal')) {
        return 60000; // 1 menit untuk halaman tes (lebih agresif)
    }
    
    if (user?.role === 'peserta') {
        return 120000; // 2 menit untuk peserta (lebih agresif)
    }
    
    return 240000; // 4 menit untuk admin/teacher (agresif)
};
```

### Session Lifetime Adjustment
Jika perlu, adjust session lifetime:

```env
# Untuk environment yang sangat strict
SESSION_LIFETIME=1440  # 24 jam

# Untuk testing
SESSION_LIFETIME=480   # 8 jam
```

## 🐛 Troubleshooting

### Issue: Keep-alive ping gagal
**Solusi:**
1. Check CSRF token di meta tag
2. Verify endpoint `/keep-alive` accessible
3. Check nginx logs untuk 5xx errors

### Issue: Masih ada Cloudflare challenges
**Solusi:**
1. Reduce ping interval
2. Check session domain configuration
3. Verify Cloudflare settings (Security Level)

### Issue: High server load
**Solusi:**
1. Increase ping interval
2. Optimize session table dengan index
3. Consider using Redis untuk session storage

### Issue: Session tidak tersimpan
**Solusi:**
1. Check database connection
2. Verify session table permissions
3. Check disk space untuk file-based sessions

## 📈 Expected Results

### Before Implementation
- Cloudflare challenge setiap 2-5 menit idle
- User complain saat mengerjakan tes
- Session timeout frequent

### After Implementation
- Minimal Cloudflare challenges
- Smooth test experience
- Extended session lifetime
- Happy users! 🎉

## 📞 Support

Jika ada issues setelah deployment:

1. **Check logs**: `storage/logs/laravel.log`
2. **Test endpoint**: `/session-test.html`
3. **Monitor stats**: `php artisan session:cleanup --stats`
4. **Emergency rollback**: Disable session keep-alive di `SessionManager`

## 🔒 Security Considerations

1. **CSRF Protection**: Keep-alive endpoint tetap protected dengan CSRF
2. **Rate Limiting**: Implemented di controller level
3. **Authentication**: Hanya authenticated users yang bisa ping
4. **Logging**: Monitor untuk unusual activity

## 📅 Maintenance Schedule

### Daily (Automated)
- Session cleanup: 2:00 AM
- Performance monitoring

### Weekly (Manual)
- Review keep-alive logs
- Check user feedback
- Performance optimization

### Monthly (Manual)
- Session statistics review
- Configuration tuning
- Update documentation

---

**Deployment Date**: `_______________`  
**Deployed By**: `_______________`  
**Verified By**: `_______________`
