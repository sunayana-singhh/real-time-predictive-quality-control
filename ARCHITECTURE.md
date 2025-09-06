# IntelliInspect Architecture Documentation

## System Overview

IntelliInspect is a full-stack AI-powered application for real-time quality control prediction using Kaggle Production Line sensor data. The system consists of three main components orchestrated via Docker Compose.

## Architecture Diagram

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Angular       │    │   .NET Core     │    │   Python        │
│   Frontend      │◄──►│   Backend API   │◄──►│   ML Service    │
│   (Port 4200)   │    │   (Port 5000)   │    │   (Port 8000)   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Nginx         │    │   SQLite DB     │    │   Model Storage │
│   Web Server    │    │   (Dataset)     │    │   (Files)       │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## Component Details

### 1. Frontend (Angular 18+)
- **Technology**: Angular 18 with standalone components
- **Port**: 4200 (mapped to 80 in container)
- **Features**:
  - 4-step wizard interface
  - Drag-and-drop file upload
  - Real-time data visualization
  - Responsive design with Bootstrap
- **Key Components**:
  - `UploadComponent`: Dataset upload and validation
  - `DateRangesComponent`: Date range configuration
  - `TrainingComponent`: Model training interface
  - `SimulationComponent`: Real-time simulation

### 2. Backend (.NET Core 8)
- **Technology**: ASP.NET Core 8 Web API
- **Port**: 5000 (mapped to 80 in container)
- **Database**: SQLite with Entity Framework Core
- **Features**:
  - RESTful API endpoints
  - CSV processing and validation
  - Data persistence and retrieval
  - ML service integration
- **Key Controllers**:
  - `DatasetController`: File upload and date range validation
  - `ModelController`: Model training coordination
  - `SimulationController`: Simulation management

### 3. ML Service (Python 3.13 + FastAPI)
- **Technology**: FastAPI with XGBoost/LightGBM
- **Port**: 8000
- **Features**:
  - Model training and evaluation
  - Real-time prediction simulation
  - Performance metrics calculation
- **Key Endpoints**:
  - `POST /train`: Train ML model
  - `POST /simulate`: Run simulation
  - `GET /simulation/stats`: Get statistics

## Data Flow

### 1. Dataset Upload Flow
```
User Upload → Frontend → Backend API → CSV Processing → SQLite Storage → Metadata Response
```

### 2. Model Training Flow
```
Date Config → Backend → ML Service → Model Training → Performance Metrics → Response
```

### 3. Simulation Flow
```
Simulation Config → Backend → ML Service → Real-time Predictions → Frontend Display
```

## API Contracts

### Dataset Upload
```http
POST /api/dataset/upload
Content-Type: multipart/form-data

Response:
{
  "fileName": "dataset.csv",
  "totalRecords": 14704,
  "totalColumns": 5,
  "passRate": 0.7,
  "dateRange": {
    "start": "2021-01-01T00:00:00",
    "end": "2021-12-31T23:59:59"
  }
}
```

### Date Range Validation
```http
POST /api/dataset/validate-ranges
Content-Type: application/json

{
  "training": {
    "startDate": "2021-01-01",
    "endDate": "2021-06-30"
  },
  "testing": {
    "startDate": "2021-07-01",
    "endDate": "2021-09-30"
  },
  "simulation": {
    "startDate": "2021-10-01",
    "endDate": "2021-12-31"
  }
}
```

### Model Training
```http
POST /api/model/train
Content-Type: application/json

Response:
{
  "accuracy": 0.85,
  "precision": 0.82,
  "recall": 0.88,
  "f1Score": 0.85,
  "confusionMatrix": {
    "truePositives": 1200,
    "trueNegatives": 800,
    "falsePositives": 150,
    "falseNegatives": 100
  }
}
```

## Database Schema

### DatasetRecord Table
```sql
CREATE TABLE DatasetRecords (
    Id INTEGER PRIMARY KEY AUTOINCREMENT,
    SyntheticTimestamp DATETIME NOT NULL,
    Response INTEGER NOT NULL,
    Features TEXT NOT NULL -- JSON string
);

CREATE INDEX IX_DatasetRecords_SyntheticTimestamp 
ON DatasetRecords(SyntheticTimestamp);
```

## Deployment Architecture

### Docker Compose Services
```yaml
services:
  frontend:
    build: ./frontend
    ports: ["4200:80"]
    depends_on: [backend]
    
  backend:
    build: ./backend
    ports: ["5000:80"]
    depends_on: [ml-service]
    volumes: ["./backend/data:/app/data"]
    
  ml-service:
    build: ./ml-service
    ports: ["8000:8000"]
    volumes: ["./ml-service/data:/app/data"]
```

## Security Considerations

1. **CORS**: Configured to allow all origins for development
2. **File Upload**: Validates file type and size
3. **Data Validation**: Input sanitization and validation
4. **Error Handling**: Comprehensive error handling and logging

## Performance Optimizations

1. **Database Indexing**: Indexed on synthetic timestamp for fast queries
2. **Batch Processing**: CSV processing in batches of 1000 records
3. **Caching**: Memory cache for frequently accessed data
4. **Async Operations**: All I/O operations are asynchronous

## Monitoring and Logging

1. **Health Checks**: Each service exposes health endpoints
2. **Structured Logging**: JSON-formatted logs with correlation IDs
3. **Error Tracking**: Comprehensive error logging and handling
4. **Performance Metrics**: Model performance tracking

## Scalability Considerations

1. **Horizontal Scaling**: Services can be scaled independently
2. **Database**: Can be migrated to PostgreSQL for production
3. **Caching**: Redis can be added for distributed caching
4. **Load Balancing**: Nginx can be configured for load balancing

## Development Workflow

1. **Local Development**: Each service can be run independently
2. **Hot Reload**: Frontend and backend support hot reload
3. **API Documentation**: Swagger/OpenAPI documentation
4. **Testing**: Unit and integration test support

## Production Deployment

1. **Environment Variables**: Configuration via environment variables
2. **Secrets Management**: Secure handling of API keys and credentials
3. **SSL/TLS**: HTTPS termination at load balancer
4. **Backup Strategy**: Regular database backups
5. **Monitoring**: Application performance monitoring (APM)
