#!/bin/bash

# Docker Laravel Deployment Script
# Usage: ./docker-deploy.sh [--no-build] [--force]

set -e  # Exit on any error

PROJECT_NAME="tes_online_unsika"
BACKUP_DIR="backups"
COMPOSE_FILE="docker compose.yml"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
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

# Check if docker and docker compose are installed
check_requirements() {
    print_status "Checking requirements..."

    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed!"
        exit 1
    fi

    if ! command -v docker compose &> /dev/null && ! docker compose version &> /dev/null; then
        print_error "Docker Compose is not installed!"
        exit 1
    fi

    print_success "Requirements check passed"
}

# Create backup of database
backup_database() {
    print_status "Creating database backup..."

    # Create backup directory if not exists
    mkdir -p $BACKUP_DIR

    # Generate backup filename with timestamp
    BACKUP_FILE="${BACKUP_DIR}/database_backup_$(date +%Y%m%d_%H%M%S).sql"

    # Create database backup
    if docker compose exec -T mysql mysqldump -u root -pTpFBSyz35Fmc2ALT sql_onlinetest > $BACKUP_FILE 2>/dev/null; then
        print_success "Database backup created: $BACKUP_FILE"
    else
        print_warning "Could not create database backup (database might not be running)"
    fi
}

# Git pull latest changes
update_code() {
    print_status "Pulling latest code from repository..."

    # Stash any local changes
    if git status --porcelain | grep -q .; then
        print_warning "Local changes detected, stashing them..."
        git stash
    fi

    # Pull latest changes
    git pull origin main

    print_success "Code updated successfully"
}

# Build and deploy containers
deploy_containers() {
    local rebuild=${1:-true}

    print_status "Deploying Docker containers..."

    # Stop containers gracefully
    print_status "Stopping existing containers..."
    docker compose down

    if [ "$rebuild" = "true" ]; then
        # Rebuild images
        print_status "Building Docker images..."
        docker compose build --no-cache
    fi

    # Start containers
    print_status "Starting containers..."
    docker compose up -d

    # Wait for containers to be ready
    print_status "Waiting for containers to be ready..."
    sleep 10

    print_success "Containers deployed successfully"
}

# Run Laravel optimizations
optimize_laravel() {
    print_status "Running Laravel optimizations..."

    # Wait for app container to be fully ready
    sleep 5

    # Install/Update composer dependencies
    print_status "Installing Composer dependencies..."
    docker compose exec app composer install --optimize-autoloader --no-dev

    # Clear caches
    print_status "Clearing Laravel caches..."
    docker compose exec app php artisan config:clear
    docker compose exec app php artisan route:clear
    docker compose exec app php artisan view:clear
    docker compose exec app php artisan cache:clear

    # Run migrations
    print_status "Running database migrations..."
    docker compose exec app php artisan migrate --force

    # Cache configurations
    print_status "Caching configurations..."
    docker compose exec app php artisan config:cache
    docker compose exec app php artisan route:cache
    docker compose exec app php artisan view:cache

    # Generate optimized autoloader
    print_status "Generating optimized autoloader..."
    docker compose exec app composer dump-autoload --optimize

    # Set proper permissions
    print_status "Setting proper permissions..."
    docker compose exec app chown -R www-data:www-data storage bootstrap/cache
    docker compose exec app chmod -R 775 storage bootstrap/cache

    print_success "Laravel optimization completed"
}

# Setup queue worker
setup_queue_worker() {
    print_status "Setting up queue worker..."

    # Check if queue worker container already exists
    if docker compose ps | grep -q queue-worker; then
        print_status "Restarting existing queue worker..."
        docker compose restart queue-worker
    else
        print_status "Starting queue worker..."
        # Add queue worker to docker compose if not exists
        if ! grep -q "queue-worker" $COMPOSE_FILE; then
            print_warning "Queue worker not found in docker compose.yml"
            print_status "You may need to add queue worker service manually"
        fi
    fi

    # Alternative: Run queue worker in app container
    print_status "Restarting queue processing..."
    docker compose exec -d app php artisan queue:restart

    print_success "Queue worker setup completed"
}

# Health check
health_check() {
    print_status "Performing health check..."

    # Check if containers are running
    if ! docker compose ps | grep -q "Up"; then
        print_error "Some containers are not running!"
        docker compose ps
        return 1
    fi

    # Check Laravel application
    print_status "Checking Laravel application..."
    docker compose exec app php artisan about

    # Check database connection
    print_status "Checking database connection..."
    if docker compose exec app php artisan tinker --execute="DB::connection()->getPdo(); echo 'Database connected successfully';" 2>/dev/null | grep -q "Database connected"; then
        print_success "Database connection OK"
    else
        print_error "Database connection failed!"
        return 1
    fi

    print_success "Health check passed"
}

# Cleanup old images and containers
cleanup() {
    print_status "Cleaning up old Docker images and containers..."

    # Remove dangling images
    docker image prune -f

    # Remove unused containers
    docker container prune -f

    print_success "Cleanup completed"
}

# Main deployment function
main() {
    local no_build=false
    local force=false

    # Parse arguments
    while [[ $# -gt 0 ]]; do
        case $1 in
            --no-build)
                no_build=true
                shift
                ;;
            --force)
                force=true
                shift
                ;;
            -h|--help)
                echo "Usage: $0 [--no-build] [--force]"
                echo "  --no-build  Skip Docker image rebuild"
                echo "  --force     Force deployment without confirmation"
                exit 0
                ;;
            *)
                print_error "Unknown option: $1"
                exit 1
                ;;
        esac
    done

    print_status "Starting Docker Laravel deployment..."

    # Confirmation prompt (unless forced)
    if [ "$force" != "true" ]; then
        echo -e "${YELLOW}This will deploy the latest code and restart containers.${NC}"
        read -p "Continue? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            print_status "Deployment cancelled"
            exit 0
        fi
    fi

    # Run deployment steps
    check_requirements
    backup_database
    update_code

    # Deploy containers
    if [ "$no_build" = "true" ]; then
        deploy_containers false
    else
        deploy_containers true
    fi

    optimize_laravel
    setup_queue_worker
    health_check
    cleanup

    print_success "🎉 Deployment completed successfully!"
    print_status "Application is now running at: http://$(curl -s ifconfig.me 2>/dev/null || echo 'your-server-ip')"

    # Show container status
    echo ""
    print_status "Container status:"
    docker compose ps
}

# Run main function with all arguments
main "$@"
