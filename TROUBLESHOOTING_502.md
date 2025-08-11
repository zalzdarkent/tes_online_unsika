# Troubleshooting 502 Bad Gateway Errors

## Problem Analysis

The 502 Bad Gateway errors on `/jadwal` and `/users` routes were caused by:

1. **Memory Exhaustion**: Bulk operations loading too much data into memory
2. **Inefficient Queries**: N+1 query problems and loading unnecessary data
3. **PHP-FPM Timeout**: Long-running processes exceeding PHP-FPM limits
4. **Bulk Update Operations**: `updateExpiredJadwalStatus()` running on every page load

## Solutions Implemented

### 1. **Optimized Controllers**
- ✅ Limited `updateExpiredJadwalStatus()` to specific user only
- ✅ Added `select()` clauses to reduce memory usage
- ✅ Moved expired jadwal updates to background jobs
- ✅ Added batch limits (max 100 items) for bulk operations

### 2. **Background Job Processing**
- ✅ Created `UpdateExpiredJadwalJob` for async processing
- ✅ Added scheduled command `jadwal:update-expired`
- ✅ Implemented hourly cron job for expired jadwal cleanup

### 3. **Rate Limiting**
- ✅ Added `BulkActionThrottle` middleware
- ✅ Limited bulk operations to 10 requests per minute
- ✅ Applied throttling to all bulk-destroy routes

### 4. **Query Optimization**
- ✅ Used `select()` to load only required fields
- ✅ Optimized relationship loading with specific columns
- ✅ Added database indexes for frequently queried fields

### 5. **Frontend Improvements**
- ✅ Added client-side validation for bulk operation limits
- ✅ Improved error handling with detailed messages
- ✅ Added loading states for better UX

## Deployment Instructions

### 1. **Update PHP-FPM Configuration**
```bash
sudo cp docker/php-fpm-optimized.conf /etc/php/8.2/fpm/pool.d/www.conf
sudo systemctl reload php8.2-fpm
```

### 2. **Update Nginx Configuration**
```bash
sudo cp docker/nginx-optimized.conf /etc/nginx/sites-available/your-site
sudo nginx -t
sudo systemctl reload nginx
```

### 3. **Deploy Application Changes**
```bash
chmod +x deploy-production.sh
./deploy-production.sh
```

### 4. **Setup Queue Workers**
```bash
# Start queue worker
php artisan queue:work --daemon --sleep=3 --tries=3

# Or using supervisor (recommended)
sudo nano /etc/supervisor/conf.d/laravel-worker.conf
```

### 5. **Setup Cron Job**
```bash
# Add to crontab
crontab -e

# Add this line
* * * * * cd /path/to/your/project && php artisan schedule:run >> /dev/null 2>&1
```

## Monitoring Commands

### Check Application Status
```bash
php artisan about
php artisan queue:monitor
php artisan schedule:list
```

### Monitor PHP-FPM
```bash
# Check PHP-FPM status
sudo systemctl status php8.2-fpm

# Monitor slow queries
sudo tail -f /var/log/php8.2-fpm-slow.log
```

### Monitor Nginx
```bash
# Check error logs
sudo tail -f /var/log/nginx/error.log

# Check access logs for 502 errors
sudo grep "502" /var/log/nginx/access.log
```

### Laravel Logs
```bash
# Monitor application logs
tail -f storage/logs/laravel.log

# Check for memory issues
grep "memory" storage/logs/laravel.log
```

## Performance Tuning

### Database Optimization
```sql
-- Add indexes for frequently queried fields
CREATE INDEX idx_jadwal_user_status ON jadwal(user_id, status);
CREATE INDEX idx_jadwal_expired ON jadwal(tanggal_berakhir, status);
CREATE INDEX idx_users_role ON users(role);
```

### Redis Cache (Optional)
```bash
# Install Redis for better caching
sudo apt install redis-server
php artisan config:cache
```

### OpCache Configuration
```ini
; Add to php.ini
opcache.enable=1
opcache.memory_consumption=128
opcache.interned_strings_buffer=8
opcache.max_accelerated_files=4000
opcache.revalidate_freq=60
opcache.fast_shutdown=1
```

## Rollback Plan

If issues persist:

1. **Revert to Previous Version**
```bash
git checkout HEAD~1
./deploy-production.sh
```

2. **Disable Background Jobs**
```bash
# Comment out in routes/console.php
// Schedule::command('jadwal:update-expired')->hourly();
```

3. **Increase PHP Limits Temporarily**
```ini
memory_limit = 512M
max_execution_time = 300
```

## Preventive Measures

1. **Regular Monitoring**: Setup alerts for 502 errors
2. **Load Testing**: Test bulk operations with realistic data volumes
3. **Database Maintenance**: Regular optimization and cleanup
4. **Caching Strategy**: Implement Redis/Memcached for frequently accessed data
5. **CDN**: Use CDN for static assets to reduce server load

## Contact

For issues or questions, check the Laravel logs first:
```bash
tail -f storage/logs/laravel.log
```
