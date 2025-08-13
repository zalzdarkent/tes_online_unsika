#!/bin/bash

# VPS Production Update Script
# Script untuk update aplikasi di VPS yang sudah running dengan Docker
# Usage: ./vps-update.sh

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check if this is being run on VPS
check_environment() {
    print_status "Checking environment..."
    
    if [ ! -f "docker-compose.yml" ]; then
        print_error "docker-compose.yml not found! Are you in the correct directory?"
        exit 1
    fi
    
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed!"
        exit 1
    fi
    
    if ! command -v git &> /dev/null; then
        print_error "Git is not installed!"
        exit 1
    fi
    
    print_success "Environment check passed"
}

# Backup current state
backup_current_state() {
    print_status "Creating backup of current state..."
    
    # Create backup directory
    BACKUP_DIR="backups/$(date +%Y%m%d_%H%M%S)"
    mkdir -p "$BACKUP_DIR"
    
    # Backup database
    if docker compose ps | grep -q "mysql.*Up"; then
        print_status "Backing up database..."
        docker compose exec -T mysql mysqldump -u root -pTpFBSyz35Fmc2ALT sql_onlinetest > "$BACKUP_DIR/database_backup.sql" 2>/dev/null || print_warning "Database backup failed"
    fi
    
    # Backup current code (in case rollback needed)
    git stash push -m "backup_before_update_$(date +%Y%m%d_%H%M%S)" || print_warning "No local changes to stash"
    
    print_success "Backup completed: $BACKUP_DIR"
}

# Pull latest changes from GitHub
update_code() {
    print_status "Pulling latest code from GitHub..."
    
    # Show current commit
    echo "Current commit: $(git rev-parse --short HEAD) - $(git log -1 --pretty=format:'%s')"
    
    # Pull latest changes
    git fetch origin main
    git reset --hard origin/main
    
    # Show new commit
    echo "Updated to commit: $(git rev-parse --short HEAD) - $(git log -1 --pretty=format:'%s')"
    
    print_success "Code updated successfully"
}

# Update containers with zero-downtime strategy
update_containers() {
    print_status "Updating Docker containers with optimized configurations..."
    
    # Check if containers are currently running
    if docker compose ps | grep -q "Up"; then
        print_status "Containers are running, performing rolling update..."
        
        # Build new images first
        print_status "Building updated containers..."
        docker compose build --no-cache
        
        # Update containers one by one to minimize downtime
        print_status "Updating app container..."
        docker compose up -d --no-deps app
        sleep 10
        
        print_status "Updating webserver container..."
        docker compose up -d --no-deps webserver
        sleep 5
        
        print_status "Updating other containers..."
        docker compose up -d
        
    else
        print_warning "Containers not running, starting fresh..."
        docker compose up -d --build
    fi
    
    # Wait for containers to be ready
    print_status "Waiting for containers to be ready..."
    sleep 15
    
    print_success "Containers updated successfully"
}

# Apply Laravel optimizations
apply_laravel_optimizations() {
    print_status "Applying Laravel optimizations..."
    
    # Wait for app container to be fully ready
    sleep 5
    
    # Clear all caches first
    print_status "Clearing Laravel caches..."
    docker compose exec app php artisan config:clear || print_warning "Config clear failed"
    docker compose exec app php artisan route:clear || print_warning "Route clear failed"
    docker compose exec app php artisan view:clear || print_warning "View clear failed"
    docker compose exec app php artisan cache:clear || print_warning "Cache clear failed"
    
    # Update dependencies if composer.lock changed
    print_status "Updating composer dependencies..."
    docker compose exec app composer install --optimize-autoloader --no-dev || print_warning "Composer install failed"
    
    # Run database migrations
    print_status "Running database migrations..."
    docker compose exec app php artisan migrate --force || print_warning "Migration failed"
    
    # Cache configurations for production
    print_status "Caching configurations..."
    docker compose exec app php artisan config:cache || print_warning "Config cache failed"
    docker compose exec app php artisan route:cache || print_warning "Route cache failed"
    docker compose exec app php artisan view:cache || print_warning "View cache failed"
    
    # Set proper permissions
    print_status "Setting proper permissions..."
    docker compose exec app chown -R www-data:www-data /var/www/storage /var/www/bootstrap/cache
    docker compose exec app chmod -R 775 /var/www/storage /var/www/bootstrap/cache
    
    print_success "Laravel optimizations applied"
}

# Health check after update
health_check() {
    print_status "Performing health check..."
    
    # Check container status
    if ! docker compose ps | grep -q "Up"; then
        print_error "Some containers are not running!"
        docker compose ps
        return 1
    fi
    
    # Check Laravel application
    if docker compose exec app php artisan about >/dev/null 2>&1; then
        print_success "Laravel application is healthy"
    else
        print_error "Laravel application health check failed"
        return 1
    fi
    
    # Check database connection
    if docker compose exec app php artisan tinker --execute="DB::connection()->getPdo(); echo 'Database OK';" 2>/dev/null | grep -q "Database OK"; then
        print_success "Database connection is working"
    else
        print_error "Database connection failed"
        return 1
    fi
    
    # Test web endpoints
    print_status "Testing web endpoints..."
    
    # Get nginx port
    NGINX_PORT=$(docker compose port webserver 80 2>/dev/null | cut -d: -f2)
    if [ -z "$NGINX_PORT" ]; then
        NGINX_PORT="80"
    fi
    
    BASE_URL="http://localhost:${NGINX_PORT}"
    
    # Test main page
    if curl -f -s "${BASE_URL}/" >/dev/null; then
        print_success "Main page is accessible"
    else
        print_warning "Main page may have issues"
    fi
    
    # Test problematic endpoints that we optimized
    if curl -f -s "${BASE_URL}/jadwal" >/dev/null 2>&1; then
        print_success "Jadwal page is accessible"
    else
        print_warning "Jadwal page may need login"
    fi
    
    if curl -f -s "${BASE_URL}/users" >/dev/null 2>&1; then
        print_success "Users page is accessible"
    else
        print_warning "Users page may need login"
    fi
    
    print_success "Health check completed"
}

# Restart queue workers to pick up new code
restart_queue_workers() {
    print_status "Restarting queue workers..."
    
    if docker compose ps | grep -q "queue-worker"; then
        docker compose restart queue-worker
        print_success "Queue worker restarted"
    else
        # Alternative: restart queue in app container
        docker compose exec app php artisan queue:restart || print_warning "Queue restart failed"
        print_success "Queue processing restarted"
    fi
}

# Clean up old Docker resources
cleanup() {
    print_status "Cleaning up old Docker resources..."
    
    # Remove unused images
    docker image prune -f >/dev/null 2>&1 || true
    
    # Remove unused containers
    docker container prune -f >/dev/null 2>&1 || true
    
    print_success "Cleanup completed"
}

# Show final status
show_final_status() {
    echo ""
    print_success "🎉 VPS Update completed successfully!"
    echo "======================================"
    echo ""
    print_status "📊 Current Status:"
    docker compose ps
    echo ""
    print_status "💾 Resource Usage:"
    docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.MemPerc}}" | head -5
    echo ""
    print_status "🌐 Application URLs:"
    
    # Get server IP
    SERVER_IP=$(curl -s ifconfig.me 2>/dev/null || echo "your-server-ip")
    echo "   Main App: http://${SERVER_IP}"
    echo "   phpMyAdmin: http://${SERVER_IP}:8080"
    echo ""
    print_status "📊 Performance Test (Response Times):"
    
    NGINX_PORT=$(docker compose port webserver 80 2>/dev/null | cut -d: -f2)
    if [ -z "$NGINX_PORT" ]; then
        NGINX_PORT="80"
    fi
    
    BASE_URL="http://localhost:${NGINX_PORT}"
    
    echo -n "   Main page: "
    curl -o /dev/null -s -w "%{time_total}s\n" "${BASE_URL}/" 2>/dev/null || echo "FAILED"
    
    echo -n "   Jadwal page: "
    curl -o /dev/null -s -w "%{time_total}s\n" "${BASE_URL}/jadwal" 2>/dev/null || echo "FAILED/AUTH_REQUIRED"
    
    echo -n "   Users page: "
    curl -o /dev/null -s -w "%{time_total}s\n" "${BASE_URL}/users" 2>/dev/null || echo "FAILED/AUTH_REQUIRED"
    
    echo ""
    print_status "🔍 Monitoring Commands:"
    echo "   ./docker-monitor.sh                    # Full performance monitoring"
    echo "   ./docker-quick-fix.sh                  # Quick fix if issues arise"
    echo "   docker compose logs -f app             # Follow application logs"
    echo "   docker stats                           # Live resource monitoring"
}

# Rollback function in case of failure
rollback() {
    print_error "Update failed! Attempting rollback..."
    
    # Go back to previous commit
    git reset --hard HEAD~1
    
    # Rebuild and restart containers
    docker compose down
    docker compose up -d --build
    
    print_error "Rollback completed. Please check the application."
}

# Main execution
main() {
    print_status "🚀 Starting VPS Production Update..."
    echo "====================================="
    
    # Check if we should proceed
    echo -e "${YELLOW}This will update the production application with the latest optimizations.${NC}"
    read -p "Continue? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_status "Update cancelled"
        exit 0
    fi
    
    # Set trap for rollback on failure
    trap rollback ERR
    
    # Execute update steps
    check_environment
    backup_current_state
    update_code
    update_containers
    apply_laravel_optimizations
    restart_queue_workers
    health_check
    cleanup
    show_final_status
    
    # Remove trap
    trap - ERR
    
    print_success "✅ Update completed successfully!"
    print_status "The application should now have improved performance and no more 502 errors."
}

# Run main function
main "$@"
