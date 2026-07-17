#!/bin/bash
# Docker deployment helper script for Linux/Mac

if [ -z "$1" ]; then
    cat << EOF

Transmission Tool - Docker Helper
==================================

Usage: ./deploy.sh [command]

Commands:
  build          Build Docker images
  up             Start containers
  down           Stop containers
  restart        Restart containers
  logs           Show backend logs (realtime)
  logs-frontend  Show frontend logs (realtime)
  status         Show container status
  shell-backend  Open shell in backend container
  shell-frontend Open shell in frontend container
  clean          Remove containers and images

Examples:
  ./deploy.sh build
  ./deploy.sh up
  ./deploy.sh logs
  ./deploy.sh down

EOF
    exit 0
fi

case "$1" in
    build)
        echo "Building Docker images..."
        docker-compose build
        ;;
    up)
        echo "Starting containers..."
        docker-compose up -d
        echo ""
        echo "Services started:"
        docker-compose ps
        ;;
    down)
        echo "Stopping containers..."
        docker-compose down
        ;;
    restart)
        echo "Restarting containers..."
        docker-compose restart
        ;;
    logs)
        echo "Showing backend logs (press Ctrl+C to exit)..."
        docker logs -f transmission-backend
        ;;
    logs-frontend)
        echo "Showing frontend logs (press Ctrl+C to exit)..."
        docker logs -f transmission-frontend
        ;;
    status)
        echo ""
        docker-compose ps
        ;;
    shell-backend)
        echo "Opening terminal in backend container..."
        docker exec -it transmission-backend sh
        ;;
    shell-frontend)
        echo "Opening terminal in frontend container..."
        docker exec -it transmission-frontend sh
        ;;
    clean)
        echo "Removing containers and images..."
        docker-compose down --rmi all
        echo "Done."
        ;;
    *)
        echo "Unknown command: $1"
        exit 1
        ;;
esac
