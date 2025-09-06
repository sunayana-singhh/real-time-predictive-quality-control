# IntelliInspect - Quick Start Guide

## Prerequisites
- Docker Desktop installed and running
- Ports 4200, 5000, 8000 available

## Run the Project

### Windows
```bash
cd N:\PROJECT_1
setup.bat
```

### Linux/Mac
```bash
cd /path/to/PROJECT_1
chmod +x setup.sh
./setup.sh
```

### Manual (All Platforms)
```bash
cd PROJECT_1
docker-compose up --build
```

## Access Application
- **Main App**: http://localhost:4200
- **API**: http://localhost:5000
- **ML Service**: http://localhost:8000

## Usage
1. Upload sample dataset: `sample-data/sample_dataset.csv`
2. Configure date ranges
3. Train model
4. Run simulation

## Stop Services
```bash
docker-compose down
```

## Restart Services
```bash
docker-compose restart
```

---
**That's it!** The complete IntelliInspect application will be running.
