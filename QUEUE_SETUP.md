# Laravel Queue Management Guide

## Production Setup Options

### Option 1: Supervisor (Recommended)

#### 1. Install Supervisor
```bash
# Ubuntu/Debian
sudo apt update
sudo apt install supervisor

# CentOS/RHEL
sudo yum install supervisor
```

#### 2. Configure Worker
```bash
# Copy configuration
sudo cp docker/supervisor-laravel-worker.conf /etc/supervisor/conf.d/

# Edit paths in the config file
sudo nano /etc/supervisor/conf.d/supervisor-laravel-worker.conf

# Update supervisor
sudo supervisorctl reread
sudo supervisorctl update

# Start workers
sudo supervisorctl start laravel-worker:*
```

#### 3. Management Commands
```bash
# Start workers
sudo supervisorctl start laravel-worker:*

# Stop workers
sudo supervisorctl stop laravel-worker:*

# Restart workers
sudo supervisorctl restart laravel-worker:*

# Check status
sudo supervisorctl status
```

### Option 2: Systemd Service

#### 1. Install Service
```bash
# Copy service file
sudo cp docker/laravel-queue.service /etc/systemd/system/

# Edit paths in the service file
sudo nano /etc/systemd/system/laravel-queue.service

# Reload systemd
sudo systemctl daemon-reload

# Enable service
sudo systemctl enable laravel-queue

# Start service
sudo systemctl start laravel-queue
```

#### 2. Management Commands
```bash
# Start service
sudo systemctl start laravel-queue

# Stop service
sudo systemctl stop laravel-queue

# Restart service
sudo systemctl restart laravel-queue

# Check status
sudo systemctl status laravel-queue

# View logs
sudo journalctl -u laravel-queue -f
```

### Option 3: Docker Compose (If using Docker)

Add to your `docker-compose.yml`:

```yaml
queue-worker:
  build: .
  command: php artisan queue:work --sleep=3 --tries=3 --daemon
  volumes:
    - .:/var/www
  depends_on:
    - app
    - redis
  restart: unless-stopped
  environment:
    - QUEUE_CONNECTION=redis
```

## Quick Setup for Your Server

### 1. Make queue manager executable
```bash
chmod +x queue-manager.sh
```

### 2. Edit paths in configuration files
```bash
# Update PROJECT_PATH in queue-manager.sh
nano queue-manager.sh

# Update paths in supervisor config
nano docker/supervisor-laravel-worker.conf

# Update paths in systemd service
nano docker/laravel-queue.service
```

### 3. Install Supervisor (Recommended)
```bash
sudo apt install supervisor
sudo cp docker/supervisor-laravel-worker.conf /etc/supervisor/conf.d/
sudo supervisorctl reread
sudo supervisorctl update
sudo supervisorctl start laravel-worker:*
```

### 4. Use management script
```bash
# Start workers
./queue-manager.sh start

# Check status
./queue-manager.sh status

# Restart workers
./queue-manager.sh restart
```

## Development Environment

For development, you can run manually:

```bash
# Simple queue worker
php artisan queue:work

# With options
php artisan queue:work --sleep=3 --tries=3 --timeout=60

# Process specific queue
php artisan queue:work --queue=default,high,low
```

## Monitoring

### Check Queue Status
```bash
php artisan queue:monitor
php artisan queue:failed
php artisan horizon:status  # If using Horizon
```

### View Logs
```bash
tail -f storage/logs/laravel.log
tail -f storage/logs/queue.log
```

### Performance Monitoring
```bash
# Check worker processes
ps aux | grep "queue:work"

# Check memory usage
htop
```

## Troubleshooting

### If workers stop working:
```bash
# Restart workers
php artisan queue:restart

# Clear failed jobs
php artisan queue:flush

# Check for errors
tail -f storage/logs/laravel.log
```

### If jobs are not processing:
```bash
# Check queue configuration
php artisan config:show queue

# Test job dispatch
php artisan tinker
>>> App\Jobs\UpdateExpiredJadwalJob::dispatch();
```

## Best Practices

1. **Always use process managers** (Supervisor/systemd) in production
2. **Monitor worker memory usage** and restart periodically
3. **Set appropriate timeouts** and retry limits
4. **Use Redis** for better queue performance
5. **Monitor failed jobs** and handle them appropriately
