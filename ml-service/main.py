"""
IntelliInspect ML Service
FastAPI service for machine learning model training and prediction
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
import pandas as pd
import numpy as np
import xgboost as xgb
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, confusion_matrix
from sklearn.model_selection import train_test_split
import joblib
import os
import json
from datetime import datetime
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title="IntelliInspect ML Service",
    description="Machine Learning service for quality control prediction",
    version="1.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global variables for model and data storage
trained_model = None
model_metrics = {}
simulation_results = []
simulation_stats = {}

# Pydantic models for request/response
class TrainingDataPoint(BaseModel):
    timestamp: str
    response: int
    features: Dict[str, float]

class TrainingRequest(BaseModel):
    trainStart: str
    trainEnd: str
    testStart: str
    testEnd: str
    trainingData: List[TrainingDataPoint]
    testingData: List[TrainingDataPoint]

class SimulationDataPoint(BaseModel):
    timestamp: str
    id: int
    response: int
    features: Dict[str, float]

class SimulationRequest(BaseModel):
    simulationStart: str
    simulationEnd: str
    data: List[SimulationDataPoint]

class TrainingResult(BaseModel):
    accuracy: float
    precision: float
    recall: float
    f1Score: float
    trainingChartData: Dict[str, Any]
    confusionMatrix: Dict[str, int]

class SimulationResult(BaseModel):
    timestamp: str
    sampleId: str
    prediction: str
    confidence: float
    temperature: float
    pressure: float
    humidity: float

class SimulationStats(BaseModel):
    totalPredictions: int
    passCount: int
    failCount: int
    averageConfidence: float

@app.get("/")
async def root():
    """Root endpoint"""
    return {"message": "IntelliInspect ML Service is running", "version": "1.0.0"}

@app.get("/health")
async def health():
    """Health check endpoint"""
    return {"status": "healthy", "timestamp": datetime.utcnow().isoformat()}

@app.post("/train", response_model=TrainingResult)
async def train_model(request: TrainingRequest):
    """
    Train XGBoost model with provided training and testing data
    """
    try:
        logger.info(f"Starting model training with {len(request.trainingData)} training samples")
        
        # Convert training data to DataFrame
        train_df = pd.DataFrame([
            {
                **point.features,
                'response': point.response
            }
            for point in request.trainingData
        ])
        
        # Convert testing data to DataFrame
        test_df = pd.DataFrame([
            {
                **point.features,
                'response': point.response
            }
            for point in request.testingData
        ])
        
        if train_df.empty or test_df.empty:
            raise HTTPException(status_code=400, detail="Training or testing data is empty")
        
        # Prepare features and target
        feature_columns = [col for col in train_df.columns if col != 'response']
        X_train = train_df[feature_columns]
        y_train = train_df['response']
        X_test = test_df[feature_columns]
        y_test = test_df['response']
        
        # Handle missing values
        X_train = X_train.fillna(0)
        X_test = X_test.fillna(0)
        
        # Train XGBoost model
        global trained_model
        trained_model = xgb.XGBClassifier(
            n_estimators=100,
            max_depth=6,
            learning_rate=0.1,
            random_state=42,
            eval_metric='logloss'
        )
        
        # Train the model
        trained_model.fit(X_train, y_train)
        
        # Make predictions
        y_pred = trained_model.predict(X_test)
        y_pred_proba = trained_model.predict_proba(X_test)[:, 1]
        
        # Calculate metrics
        accuracy = accuracy_score(y_test, y_pred)
        precision = precision_score(y_test, y_pred, zero_division=0)
        recall = recall_score(y_test, y_pred, zero_division=0)
        f1 = f1_score(y_test, y_pred, zero_division=0)
        
        # Confusion matrix
        cm = confusion_matrix(y_test, y_pred)
        tn, fp, fn, tp = cm.ravel()
        
        # Generate training chart data (simulated for demo)
        training_chart_data = {
            "labels": [f"Epoch {i+1}" for i in range(10)],
            "datasets": [
                {
                    "label": "Accuracy",
                    "data": [0.6 + i * 0.03 + np.random.normal(0, 0.02) for i in range(10)],
                    "borderColor": "#007bff",
                    "backgroundColor": "rgba(0, 123, 255, 0.1)"
                },
                {
                    "label": "Loss",
                    "data": [0.8 - i * 0.06 + np.random.normal(0, 0.02) for i in range(10)],
                    "borderColor": "#dc3545",
                    "backgroundColor": "rgba(220, 53, 69, 0.1)"
                }
            ]
        }
        
        # Store model metrics
        global model_metrics
        model_metrics = {
            "accuracy": accuracy,
            "precision": precision,
            "recall": recall,
            "f1_score": f1,
            "confusion_matrix": {"tn": int(tn), "fp": int(fp), "fn": int(fn), "tp": int(tp)}
        }
        
        # Save model
        model_path = "/app/data/trained_model.pkl"
        os.makedirs(os.path.dirname(model_path), exist_ok=True)
        joblib.dump(trained_model, model_path)
        
        logger.info(f"Model training completed. Accuracy: {accuracy:.3f}")
        
        return TrainingResult(
            accuracy=accuracy,
            precision=precision,
            recall=recall,
            f1Score=f1,
            trainingChartData=training_chart_data,
            confusionMatrix={
                "truePositives": int(tp),
                "trueNegatives": int(tn),
                "falsePositives": int(fp),
                "falseNegatives": int(fn)
            }
        )
        
    except Exception as e:
        logger.error(f"Error training model: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Model training failed: {str(e)}")

@app.post("/simulate", response_model=List[SimulationResult])
async def simulate_predictions(request: SimulationRequest):
    """
    Run simulation with real-time predictions
    """
    try:
        global trained_model, simulation_results, simulation_stats
        
        if trained_model is None:
            raise HTTPException(status_code=400, detail="No trained model available. Please train a model first.")
        
        logger.info(f"Starting simulation with {len(request.data)} data points")
        
        simulation_results = []
        pass_count = 0
        fail_count = 0
        total_confidence = 0
        
        # Process each data point
        for i, point in enumerate(request.data):
            # Prepare features
            features_df = pd.DataFrame([point.features])
            features_df = features_df.fillna(0)
            
            # Make prediction
            prediction_proba = trained_model.predict_proba(features_df)[0]
            prediction = 1 if prediction_proba[1] > 0.5 else 0
            confidence = float(prediction_proba[1] if prediction == 1 else prediction_proba[0])
            
            # Generate synthetic sensor data (for demo purposes)
            temperature = 20 + np.random.normal(0, 5)  # 20°C ± 5°C
            pressure = 1000 + np.random.normal(0, 50)  # 1000 hPa ± 50 hPa
            humidity = 50 + np.random.normal(0, 15)    # 50% ± 15%
            
            # Create simulation result
            result = SimulationResult(
                timestamp=point.timestamp,
                sampleId=f"SAMPLE_{point.id:04d}",
                prediction="Pass" if prediction == 1 else "Fail",
                confidence=confidence,
                temperature=round(temperature, 1),
                pressure=round(pressure, 0),
                humidity=round(humidity, 1)
            )
            
            simulation_results.append(result)
            
            # Update statistics
            if prediction == 1:
                pass_count += 1
            else:
                fail_count += 1
            total_confidence += confidence
        
        # Calculate final statistics
        avg_confidence = total_confidence / len(request.data) if request.data else 0
        
        simulation_stats = {
            "totalPredictions": len(request.data),
            "passCount": pass_count,
            "failCount": fail_count,
            "averageConfidence": avg_confidence
        }
        
        logger.info(f"Simulation completed. Pass: {pass_count}, Fail: {fail_count}, Avg Confidence: {avg_confidence:.3f}")
        
        return simulation_results
        
    except Exception as e:
        logger.error(f"Error in simulation: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Simulation failed: {str(e)}")

@app.get("/simulation/stats", response_model=SimulationStats)
async def get_simulation_stats():
    """
    Get simulation statistics
    """
    global simulation_stats
    
    if not simulation_stats:
        return SimulationStats(
            totalPredictions=0,
            passCount=0,
            failCount=0,
            averageConfidence=0.0
        )
    
    return SimulationStats(**simulation_stats)

@app.get("/model/info")
async def get_model_info():
    """
    Get information about the trained model
    """
    global trained_model, model_metrics
    
    if trained_model is None:
        return {"status": "No model trained", "metrics": None}
    
    return {
        "status": "Model trained",
        "model_type": "XGBoost Classifier",
        "metrics": model_metrics,
        "feature_importance": trained_model.feature_importances_.tolist() if hasattr(trained_model, 'feature_importances_') else []
    }

@app.post("/predict")
async def predict_single(data: Dict[str, float]):
    """
    Make a single prediction
    """
    global trained_model
    
    if trained_model is None:
        raise HTTPException(status_code=400, detail="No trained model available")
    
    try:
        # Prepare features
        features_df = pd.DataFrame([data])
        features_df = features_df.fillna(0)
        
        # Make prediction
        prediction_proba = trained_model.predict_proba(features_df)[0]
        prediction = 1 if prediction_proba[1] > 0.5 else 0
        confidence = float(prediction_proba[1] if prediction == 1 else prediction_proba[0])
        
        return {
            "prediction": "Pass" if prediction == 1 else "Fail",
            "confidence": confidence,
            "probability": {
                "pass": float(prediction_proba[1]),
                "fail": float(prediction_proba[0])
            }
        }
        
    except Exception as e:
        logger.error(f"Error making prediction: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Prediction failed: {str(e)}")

@app.delete("/model")
async def delete_model():
    """
    Delete the trained model
    """
    global trained_model, model_metrics, simulation_results, simulation_stats
    
    trained_model = None
    model_metrics = {}
    simulation_results = []
    simulation_stats = {}
    
    # Remove model file
    model_path = "/app/data/trained_model.pkl"
    if os.path.exists(model_path):
        os.remove(model_path)
    
    return {"message": "Model deleted successfully"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)