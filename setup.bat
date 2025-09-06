@echo off
REM IntelliInspect Setup Script for Windows

echo 🚀 Setting up IntelliInspect - Real-Time Predictive Quality Control

REM Check if Docker is installed
docker --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Docker is not installed. Please install Docker Desktop first.
    pause
    exit /b 1
)

REM Check if Docker Compose is installed
docker-compose --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Docker Compose is not installed. Please install Docker Compose first.
    pause
    exit /b 1
)

echo ✅ Docker and Docker Compose are installed

REM Create necessary directories
echo 📁 Creating directories...
if not exist "backend\data" mkdir backend\data
if not exist "ml-service\data" mkdir ml-service\data
if not exist "frontend\dist" mkdir frontend\dist

echo 🔧 Building and starting services...
docker-compose up --build -d

echo ⏳ Waiting for services to start...
timeout /t 30 /nobreak >nul

echo 🔍 Checking service health...

REM Check if services are running
curl -f http://localhost:4200 >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Frontend is running at http://localhost:4200
) else (
    echo ⚠️  Frontend might still be starting up
)

curl -f http://localhost:5000/health >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Backend is running at http://localhost:5000
) else (
    echo ⚠️  Backend might still be starting up
)

curl -f http://localhost:8000/health >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ ML Service is running at http://localhost:8000
) else (
    echo ⚠️  ML Service might still be starting up
)

echo.
echo 🎉 Setup complete!
echo.
echo 📋 Access URLs:
echo    Frontend: http://localhost:4200
echo    Backend API: http://localhost:5000
echo    ML Service: http://localhost:8000
echo.
echo 📖 Usage Instructions:
echo    1. Open http://localhost:4200 in your browser
echo    2. Upload the sample dataset from sample-data\sample_dataset.csv
echo    3. Configure date ranges for training, testing, and simulation
echo    4. Train the ML model
echo    5. Run real-time simulation
echo.
echo 🛠️  Management Commands:
echo    Stop services: docker-compose down
echo    View logs: docker-compose logs -f
echo    Restart: docker-compose restart
echo.
echo 📁 Sample dataset available at: sample-data\sample_dataset.csv
echo.
pause
