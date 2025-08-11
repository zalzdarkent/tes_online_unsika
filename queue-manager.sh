#!/bin/bash

# Laravel Queue Worker Management Script
# Usage: ./queue-manager.sh {start|stop|restart|status}

PROJECT_PATH="/path/to/your/project"
WORKER_NAME="laravel-worker"

case "$1" in
    start)
        echo "🚀 Starting Laravel queue workers..."
        cd $PROJECT_PATH
        
        # Method 1: Using Supervisor (Recommended for Production)
        if command -v supervisorctl &> /dev/null; then
            sudo supervisorctl start $WORKER_NAME:*
            echo "✅ Workers started via Supervisor"
        else
            # Method 2: Using systemd (Alternative)
            if [ -f "/etc/systemd/system/laravel-queue.service" ]; then
                sudo systemctl start laravel-queue
                echo "✅ Workers started via systemd"
            else
                # Method 3: Manual background process (Development only)
                echo "⚠️  Starting manual worker (not recommended for production)"
                nohup php artisan queue:work --sleep=3 --tries=3 --daemon > storage/logs/queue.log 2>&1 &
                echo $! > storage/queue.pid
                echo "✅ Manual worker started (PID: $(cat storage/queue.pid))"
            fi
        fi
        ;;
        
    stop)
        echo "🛑 Stopping Laravel queue workers..."
        cd $PROJECT_PATH
        
        if command -v supervisorctl &> /dev/null; then
            sudo supervisorctl stop $WORKER_NAME:*
            echo "✅ Workers stopped via Supervisor"
        elif [ -f "/etc/systemd/system/laravel-queue.service" ]; then
            sudo systemctl stop laravel-queue
            echo "✅ Workers stopped via systemd"
        else
            if [ -f "storage/queue.pid" ]; then
                kill $(cat storage/queue.pid)
                rm storage/queue.pid
                echo "✅ Manual worker stopped"
            else
                echo "❌ No worker PID file found"
            fi
        fi
        ;;
        
    restart)
        echo "🔄 Restarting Laravel queue workers..."
        cd $PROJECT_PATH
        
        # Laravel built-in restart command
        php artisan queue:restart
        
        # Wait a moment for graceful shutdown
        sleep 5
        
        # Start workers again
        $0 start
        ;;
        
    status)
        echo "📊 Checking Laravel queue worker status..."
        cd $PROJECT_PATH
        
        if command -v supervisorctl &> /dev/null; then
            supervisorctl status $WORKER_NAME:*
        elif [ -f "/etc/systemd/system/laravel-queue.service" ]; then
            systemctl status laravel-queue
        else
            if [ -f "storage/queue.pid" ]; then
                PID=$(cat storage/queue.pid)
                if ps -p $PID > /dev/null; then
                    echo "✅ Manual worker is running (PID: $PID)"
                else
                    echo "❌ Manual worker is not running"
                fi
            else
                echo "❌ No worker PID file found"
            fi
        fi
        
        # Show queue status
        echo ""
        echo "📈 Queue Statistics:"
        php artisan queue:monitor
        ;;
        
    *)
        echo "Usage: $0 {start|stop|restart|status}"
        echo ""
        echo "Commands:"
        echo "  start   - Start queue workers"
        echo "  stop    - Stop queue workers"
        echo "  restart - Restart queue workers"
        echo "  status  - Show worker and queue status"
        exit 1
        ;;
esac
