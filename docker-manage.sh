#!/bin/bash

# Docker Management Script
# Usage: ./docker-manage.sh {status|logs|restart|stop|cleanup}

case "$1" in
    status)
        echo "📊 Container Status:"
        docker compose ps
        echo ""
        echo "🔍 System Resources:"
        docker stats --no-stream
        ;;

    logs)
        if [ -n "$2" ]; then
            echo "📋 Showing logs for $2:"
            docker compose logs -f --tail=100 $2
        else
            echo "📋 Available services:"
            docker compose config --services
            echo ""
            echo "Usage: $0 logs <service_name>"
            echo "Example: $0 logs app"
        fi
        ;;

    restart)
        if [ -n "$2" ]; then
            echo "🔄 Restarting $2..."
            docker compose restart $2
        else
            echo "🔄 Restarting all containers..."
            docker compose restart
        fi
        ;;

    stop)
        echo "🛑 Stopping all containers..."
        docker compose down
        ;;

    cleanup)
        echo "🧹 Cleaning up Docker resources..."
        docker compose down
        docker system prune -f
        docker volume prune -f
        echo "✅ Cleanup completed"
        ;;

    shell)
        if [ -n "$2" ]; then
            echo "🐚 Opening shell in $2..."
            docker compose exec $2 /bin/bash
        else
            echo "🐚 Opening shell in app container..."
            docker compose exec app /bin/bash
        fi
        ;;

    artisan)
        shift
        echo "⚡ Running artisan command: $@"
        docker compose exec app php artisan "$@"
        ;;

    *)
        echo "Docker Management Script"
        echo ""
        echo "Usage: $0 {status|logs|restart|stop|cleanup|shell|artisan}"
        echo ""
        echo "Commands:"
        echo "  status              - Show container status and resource usage"
        echo "  logs [service]      - Show logs for specific service or list services"
        echo "  restart [service]   - Restart specific service or all containers"
        echo "  stop               - Stop all containers"
        echo "  cleanup            - Clean up Docker resources"
        echo "  shell [service]    - Open shell in container (default: app)"
        echo "  artisan <command>  - Run artisan command"
        echo ""
        echo "Examples:"
        echo "  $0 logs app"
        echo "  $0 restart queue-worker"
        echo "  $0 shell app"
        echo "  $0 artisan queue:work"
        exit 1
        ;;
esac
