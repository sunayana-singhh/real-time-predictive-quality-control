# IntelliInspect: Real-Time Predictive Quality Control

A full-stack AI-powered application for real-time quality control prediction using Kaggle Production Line sensor data.

## Architecture

- **Frontend**: Angular 18+ with modern UI components
- **Backend**: ASP.NET Core 8 API
- **ML Service**: Python 3.13 + FastAPI with XGBoost
- **Deployment**: Docker + docker-compose

## Quick Start

1. **Prerequisites**
   - Docker and Docker Compose installed
   - Git (to clone the repository)

2. **Run the Application**
   ```bash
   # Clone the repository
   git clone <repository-url>
   cd intelliinspect
   
   # Start all services
   docker-compose up --build
   ```

3. **Access the Application**
   - Frontend: http://localhost:4200
   - Backend API: http://localhost:5000
   - ML Service: http://localhost:8000

## Usage Guide

### Step 1: Upload Dataset
- Upload the Kaggle Bosch Production Line Performance CSV dataset
- The system will automatically augment it with synthetic timestamps
- View metadata including total records, columns, and pass rate

### Step 2: Configure Date Ranges
- Define training, testing, and simulation periods
- Ensure non-overlapping, sequential date ranges
- Validate ranges against the dataset

### Step 3: Train Model
- Trigger ML model training using XGBoost
- View performance metrics (Accuracy, Precision, Recall, F1-Score)
- Analyze training charts and confusion matrix

### Step 4: Real-Time Simulation
- Simulate real-time predictions on historical data
- Watch live quality predictions and confidence scores
- View streaming data in charts and tables

## Dataset

Download the Kaggle dataset from: https://www.kaggle.com/c/bosch-production-line-performance/data

The application expects a CSV file with a "Response" column for binary classification.

## API Endpoints

### Backend (.NET Core)
- `POST /api/dataset/upload` - Upload and process dataset
- `POST /api/dataset/validate-ranges` - Validate date ranges
- `POST /api/model/train` - Train ML model
- `POST /api/simulation/start` - Start real-time simulation

### ML Service (Python)
- `POST /train` - Train XGBoost model with date ranges
- `POST /predict` - Get single prediction
- `POST /simulate` - Stream predictions for simulation
- `GET /simulation/stats` - Get simulation statistics
- `GET /model/info` - Get model information
- `DELETE /model` - Delete trained model

## Development

### Local Development Setup

1. **Frontend Development**
   ```bash
   cd frontend
   npm install
   npm start
   ```

2. **Backend Development**
   ```bash
   cd backend
   dotnet restore
   dotnet run
   ```

3. **ML Service Development**
   ```bash
   cd ml-service
   pip install -r requirements.txt
   uvicorn main:app --reload
   ```

4. **Test ML Service**
   ```bash
   cd ml-service
   python test_service.py
   ```

## Project Structure

```
intelliinspect/
├── frontend/                 # Angular application
│   ├── src/
│   │   ├── app/
│   │   │   ├── components/   # UI components
│   │   │   ├── services/     # API services
│   │   │   └── models/       # TypeScript models
│   │   └── assets/           # Static assets
│   └── Dockerfile
├── backend/                  # .NET Core API
│   ├── Controllers/          # API controllers
│   ├── Services/             # Business logic
│   ├── Models/               # Data models
│   └── Dockerfile
├── ml-service/               # Python ML service
│   ├── main.py              # FastAPI application
│   ├── models/              # ML model logic
│   ├── requirements.txt     # Python dependencies
│   └── Dockerfile
├── docker-compose.yaml      # Container orchestration
└── README.md               # This file
```

## Features

- ✅ Drag-and-drop CSV upload with validation
- ✅ Synthetic timestamp generation
- ✅ Date range configuration and validation
- ✅ XGBoost model training with metrics
- ✅ Real-time prediction simulation
- ✅ Live charts and data visualization
- ✅ Fully dockerized deployment
- ✅ Responsive Angular UI

## Troubleshooting

1. **Port Conflicts**: Ensure ports 4200, 5000, and 8000 are available
2. **Docker Issues**: Run `docker-compose down` and `docker-compose up --build`
3. **Dataset Issues**: Ensure CSV has "Response" column for binary classification
4. **Memory Issues**: Increase Docker memory allocation for large datasets

## License

This project is created for the IntelliInspect Hackathon.
