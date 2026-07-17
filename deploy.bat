@echo off
REM Docker deployment helper script for Windows

setlocal enabledelayedexpansion

if "%1"=="" (
    echo.
    echo Transmission Tool - Docker Helper
    echo ==================================
    echo.
    echo Usage: deploy.bat [command]
    echo.
    echo Commands:
    echo   build          Build Docker images
    echo   up             Start containers
    echo   down           Stop containers
    echo   restart        Restart containers
    echo   logs           Show backend logs (realtime)
    echo   logs-frontend  Show frontend logs (realtime)
    echo   status         Show container status
    echo   shell-backend  Open shell in backend container
    echo   shell-frontend Open shell in frontend container
    echo   clean          Remove containers and images
    echo.
    goto :eof
)

if "%1"=="build" (
    echo Building Docker images...
    docker-compose build
    goto :eof
)

if "%1"=="up" (
    echo Starting containers...
    docker-compose up -d
    echo.
    echo Services started:
    docker-compose ps
    goto :eof
)

if "%1"=="down" (
    echo Stopping containers...
    docker-compose down
    goto :eof
)

if "%1"=="restart" (
    echo Restarting containers...
    docker-compose restart
    goto :eof
)

if "%1"=="logs" (
    echo Showing backend logs (press Ctrl+C to exit)...
    docker logs -f transmission-backend
    goto :eof
)

if "%1"=="logs-frontend" (
    echo Showing frontend logs (press Ctrl+C to exit)...
    docker logs -f transmission-frontend
    goto :eof
)

if "%1"=="status" (
    echo.
    docker-compose ps
    goto :eof
)

if "%1"=="shell-backend" (
    echo Opening terminal in backend container...
    docker exec -it transmission-backend sh
    goto :eof
)

if "%1"=="shell-frontend" (
    echo Opening terminal in frontend container...
    docker exec -it transmission-frontend sh
    goto :eof
)

if "%1"=="clean" (
    echo Removing containers and images...
    docker-compose down --rmi all
    echo Done.
    goto :eof
)

echo Unknown command: %1
goto :eof
