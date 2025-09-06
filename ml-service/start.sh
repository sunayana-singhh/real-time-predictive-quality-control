#!/bin/bash

# IntelliInspect ML Service Startup Script

echo "🚀 Starting IntelliInspect ML Service..."

# Check if Python is available
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is not installed"
    exit 1
fi

# Check if pip is available
if ! command -v pip3 &> /dev/null; then
    echo "❌ pip3 is not installed"
    exit 1
fi

# Create data directory
mkdir -p /app/data

# Install dependencies if requirements.txt exists
if [ -f "requirements.txt" ]; then
    echo "📦 Installing Python dependencies..."
    pip3 install -r requirements.txt
fi

# Set environment variables
export PYTHONPATH="${PYTHONPATH}:/app"
export PYTHONUNBUFFERED=1

# Start the FastAPI service
echo "🔧 Starting FastAPI service on port 8000..."
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
