#!/bin/bash

# IntelliInspect Setup Script
echo "🚀 Setting up IntelliInspect - Real-Time Predictive Quality Control"

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

echo "✅ Docker and Docker Compose are installed"

# Create necessary directories
echo "📁 Creating directories..."
mkdir -p backend/data
mkdir -p ml-service/data
mkdir -p frontend/dist

# Set permissions
chmod +x setup.sh

echo "🔧 Building and starting services..."
docker-compose up --build -d

echo "⏳ Waiting for services to start..."
sleep 30

# Check if services are running
echo "🔍 Checking service health..."

# Check frontend
if curl -f http://localhost:4200 > /dev/null 2>&1; then
    echo "✅ Frontend is running at http://localhost:4200"
else
    echo "⚠️  Frontend might still be starting up"
fi

# Check backend
if curl -f http://localhost:5000/health > /dev/null 2>&1; then
    echo "✅ Backend is running at http://localhost:5000"
else
    echo "⚠️  Backend might still be starting up"
fi

# Check ML service
if curl -f http://localhost:8000/health > /dev/null 2>&1; then
    echo "✅ ML Service is running at http://localhost:8000"
else
    echo "⚠️  ML Service might still be starting up"
fi

echo ""
echo "🎉 Setup complete!"
echo ""
echo "📋 Access URLs:"
echo "   Frontend: http://localhost:4200"
echo "   Backend API: http://localhost:5000"
echo "   ML Service: http://localhost:8000"
echo ""
echo "📖 Usage Instructions:"
echo "   1. Open http://localhost:4200 in your browser"
echo "   2. Upload the sample dataset from sample-data/sample_dataset.csv"
echo "   3. Configure date ranges for training, testing, and simulation"
echo "   4. Train the ML model"
echo "   5. Run real-time simulation"
echo ""
echo "🛠️  Management Commands:"
echo "   Stop services: docker-compose down"
echo "   View logs: docker-compose logs -f"
echo "   Restart: docker-compose restart"
echo ""
echo "📁 Sample dataset available at: sample-data/sample_dataset.csv"
