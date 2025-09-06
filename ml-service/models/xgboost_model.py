"""
XGBoost model implementation for quality control prediction
"""

import xgboost as xgb
import pandas as pd
import numpy as np
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, confusion_matrix
import joblib
import os
from typing import Dict, Any, Tuple, List
import logging

logger = logging.getLogger(__name__)

class XGBoostQualityModel:
    """
    XGBoost model for quality control prediction
    """
    
    def __init__(self, model_params: Dict[str, Any] = None):
        """
        Initialize the XGBoost model
        
        Args:
            model_params: Dictionary of model parameters
        """
        default_params = {
            'n_estimators': 100,
            'max_depth': 6,
            'learning_rate': 0.1,
            'random_state': 42,
            'eval_metric': 'logloss',
            'subsample': 0.8,
            'colsample_bytree': 0.8
        }
        
        if model_params:
            default_params.update(model_params)
        
        self.model = xgb.XGBClassifier(**default_params)
        self.feature_columns = None
        self.is_trained = False
        self.training_history = []
        
    def prepare_data(self, data: List[Dict[str, Any]]) -> Tuple[pd.DataFrame, pd.Series]:
        """
        Prepare data for training/prediction
        
        Args:
            data: List of data points with features and response
            
        Returns:
            Tuple of (features_df, target_series)
        """
        df = pd.DataFrame(data)
        
        # Separate features and target
        if 'response' in df.columns:
            target = df['response']
            features = df.drop('response', axis=1)
        else:
            target = None
            features = df
        
        # Handle missing values
        features = features.fillna(0)
        
        # Store feature columns for consistency
        if self.feature_columns is None:
            self.feature_columns = features.columns.tolist()
        else:
            # Ensure consistent feature order
            features = features.reindex(columns=self.feature_columns, fill_value=0)
        
        return features, target
    
    def train(self, train_data: List[Dict[str, Any]], 
              test_data: List[Dict[str, Any]] = None) -> Dict[str, float]:
        """
        Train the XGBoost model
        
        Args:
            train_data: Training data
            test_data: Optional test data for evaluation
            
        Returns:
            Dictionary of training metrics
        """
        try:
            logger.info(f"Training XGBoost model with {len(train_data)} samples")
            
            # Prepare training data
            X_train, y_train = self.prepare_data(train_data)
            
            # Train the model
            self.model.fit(X_train, y_train)
            self.is_trained = True
            
            # Evaluate on test data if provided
            metrics = {}
            if test_data:
                X_test, y_test = self.prepare_data(test_data)
                y_pred = self.model.predict(X_test)
                y_pred_proba = self.model.predict_proba(X_test)[:, 1]
                
                metrics = {
                    'accuracy': accuracy_score(y_test, y_pred),
                    'precision': precision_score(y_test, y_pred, zero_division=0),
                    'recall': recall_score(y_test, y_pred, zero_division=0),
                    'f1_score': f1_score(y_test, y_pred, zero_division=0)
                }
                
                # Confusion matrix
                cm = confusion_matrix(y_test, y_pred)
                if cm.shape == (2, 2):
                    tn, fp, fn, tp = cm.ravel()
                    metrics.update({
                        'true_positives': int(tp),
                        'true_negatives': int(tn),
                        'false_positives': int(fp),
                        'false_negatives': int(fn)
                    })
            
            logger.info(f"Model training completed. Metrics: {metrics}")
            return metrics
            
        except Exception as e:
            logger.error(f"Error training model: {str(e)}")
            raise
    
    def predict(self, data: List[Dict[str, Any]]) -> Tuple[np.ndarray, np.ndarray]:
        """
        Make predictions on new data
        
        Args:
            data: List of data points to predict
            
        Returns:
            Tuple of (predictions, probabilities)
        """
        if not self.is_trained:
            raise ValueError("Model must be trained before making predictions")
        
        X, _ = self.prepare_data(data)
        predictions = self.model.predict(X)
        probabilities = self.model.predict_proba(X)
        
        return predictions, probabilities
    
    def get_feature_importance(self) -> Dict[str, float]:
        """
        Get feature importance scores
        
        Returns:
            Dictionary of feature importance scores
        """
        if not self.is_trained or self.feature_columns is None:
            return {}
        
        importance_scores = self.model.feature_importances_
        return dict(zip(self.feature_columns, importance_scores))
    
    def save_model(self, filepath: str) -> None:
        """
        Save the trained model to disk
        
        Args:
            filepath: Path to save the model
        """
        if not self.is_trained:
            raise ValueError("No trained model to save")
        
        os.makedirs(os.path.dirname(filepath), exist_ok=True)
        joblib.dump({
            'model': self.model,
            'feature_columns': self.feature_columns,
            'is_trained': self.is_trained
        }, filepath)
        
        logger.info(f"Model saved to {filepath}")
    
    def load_model(self, filepath: str) -> None:
        """
        Load a trained model from disk
        
        Args:
            filepath: Path to the saved model
        """
        if not os.path.exists(filepath):
            raise FileNotFoundError(f"Model file not found: {filepath}")
        
        model_data = joblib.load(filepath)
        self.model = model_data['model']
        self.feature_columns = model_data['feature_columns']
        self.is_trained = model_data['is_trained']
        
        logger.info(f"Model loaded from {filepath}")
    
    def generate_training_chart_data(self, epochs: int = 10) -> Dict[str, Any]:
        """
        Generate simulated training chart data for visualization
        
        Args:
            epochs: Number of epochs to simulate
            
        Returns:
            Dictionary with chart data
        """
        # Simulate training progress
        accuracy_data = []
        loss_data = []
        
        for i in range(epochs):
            # Simulate improving accuracy and decreasing loss
            accuracy = 0.6 + (i / epochs) * 0.3 + np.random.normal(0, 0.02)
            loss = 0.8 - (i / epochs) * 0.5 + np.random.normal(0, 0.02)
            
            accuracy_data.append(max(0, min(1, accuracy)))
            loss_data.append(max(0, min(1, loss)))
        
        return {
            "labels": [f"Epoch {i+1}" for i in range(epochs)],
            "datasets": [
                {
                    "label": "Accuracy",
                    "data": accuracy_data,
                    "borderColor": "#007bff",
                    "backgroundColor": "rgba(0, 123, 255, 0.1)"
                },
                {
                    "label": "Loss",
                    "data": loss_data,
                    "borderColor": "#dc3545",
                    "backgroundColor": "rgba(220, 53, 69, 0.1)"
                }
            ]
        }
