"""
Data processing utilities for the ML service
"""

import pandas as pd
import numpy as np
from typing import List, Dict, Any, Tuple
import logging

logger = logging.getLogger(__name__)

class DataProcessor:
    """
    Utility class for data processing operations
    """
    
    @staticmethod
    def validate_features(features: Dict[str, float]) -> Dict[str, float]:
        """
        Validate and clean feature data
        
        Args:
            features: Dictionary of feature values
            
        Returns:
            Cleaned feature dictionary
        """
        cleaned_features = {}
        
        for key, value in features.items():
            if isinstance(value, (int, float)):
                # Handle NaN and infinite values
                if np.isnan(value) or np.isinf(value):
                    cleaned_features[key] = 0.0
                else:
                    cleaned_features[key] = float(value)
            else:
                # Convert non-numeric values to 0
                cleaned_features[key] = 0.0
        
        return cleaned_features
    
    @staticmethod
    def generate_synthetic_sensor_data() -> Dict[str, float]:
        """
        Generate synthetic sensor data for simulation
        
        Returns:
            Dictionary with synthetic sensor readings
        """
        return {
            'temperature': round(20 + np.random.normal(0, 5), 1),  # 20°C ± 5°C
            'pressure': round(1000 + np.random.normal(0, 50), 0),  # 1000 hPa ± 50 hPa
            'humidity': round(50 + np.random.normal(0, 15), 1),    # 50% ± 15%
            'vibration': round(np.random.normal(0, 0.5), 3),       # Vibration sensor
            'voltage': round(220 + np.random.normal(0, 10), 1),    # 220V ± 10V
            'current': round(5 + np.random.normal(0, 1), 2)        # 5A ± 1A
        }
    
    @staticmethod
    def calculate_confidence_metrics(predictions: np.ndarray, 
                                   probabilities: np.ndarray) -> Dict[str, float]:
        """
        Calculate confidence metrics for predictions
        
        Args:
            predictions: Array of predictions (0 or 1)
            probabilities: Array of prediction probabilities
            
        Returns:
            Dictionary of confidence metrics
        """
        if len(predictions) == 0:
            return {
                'average_confidence': 0.0,
                'min_confidence': 0.0,
                'max_confidence': 0.0,
                'confidence_std': 0.0
            }
        
        # Calculate confidence for each prediction
        confidences = []
        for i, pred in enumerate(predictions):
            if pred == 1:
                confidences.append(probabilities[i, 1])  # Probability of class 1
            else:
                confidences.append(probabilities[i, 0])  # Probability of class 0
        
        confidences = np.array(confidences)
        
        return {
            'average_confidence': float(np.mean(confidences)),
            'min_confidence': float(np.min(confidences)),
            'max_confidence': float(np.max(confidences)),
            'confidence_std': float(np.std(confidences))
        }
    
    @staticmethod
    def create_feature_matrix(data: List[Dict[str, Any]]) -> pd.DataFrame:
        """
        Create a feature matrix from list of data points
        
        Args:
            data: List of data points with features
            
        Returns:
            DataFrame with features
        """
        if not data:
            return pd.DataFrame()
        
        # Extract features from each data point
        feature_rows = []
        for point in data:
            if 'features' in point:
                cleaned_features = DataProcessor.validate_features(point['features'])
                feature_rows.append(cleaned_features)
            else:
                # If no 'features' key, use the point itself (excluding metadata)
                metadata_keys = {'timestamp', 'id', 'response', 'sampleId'}
                features = {k: v for k, v in point.items() if k not in metadata_keys}
                cleaned_features = DataProcessor.validate_features(features)
                feature_rows.append(cleaned_features)
        
        return pd.DataFrame(feature_rows)
    
    @staticmethod
    def extract_targets(data: List[Dict[str, Any]]) -> np.ndarray:
        """
        Extract target values from data points
        
        Args:
            data: List of data points
            
        Returns:
            Array of target values
        """
        targets = []
        for point in data:
            if 'response' in point:
                targets.append(point['response'])
            else:
                targets.append(0)  # Default to 0 if no response
        
        return np.array(targets)
    
    @staticmethod
    def split_data_by_time(data: List[Dict[str, Any]], 
                          train_ratio: float = 0.7,
                          test_ratio: float = 0.2,
                          val_ratio: float = 0.1) -> Tuple[List[Dict], List[Dict], List[Dict]]:
        """
        Split data chronologically by timestamp
        
        Args:
            data: List of data points with timestamps
            train_ratio: Ratio for training data
            test_ratio: Ratio for test data
            val_ratio: Ratio for validation data
            
        Returns:
            Tuple of (train_data, test_data, val_data)
        """
        if not data:
            return [], [], []
        
        # Sort by timestamp
        sorted_data = sorted(data, key=lambda x: x.get('timestamp', ''))
        
        n = len(sorted_data)
        train_end = int(n * train_ratio)
        test_end = int(n * (train_ratio + test_ratio))
        
        train_data = sorted_data[:train_end]
        test_data = sorted_data[train_end:test_end]
        val_data = sorted_data[test_end:]
        
        return train_data, test_data, val_data
    
    @staticmethod
    def calculate_data_statistics(data: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Calculate statistics for the dataset
        
        Args:
            data: List of data points
            
        Returns:
            Dictionary of statistics
        """
        if not data:
            return {
                'total_samples': 0,
                'pass_rate': 0.0,
                'feature_count': 0,
                'time_span': 0
            }
        
        # Basic counts
        total_samples = len(data)
        pass_count = sum(1 for point in data if point.get('response', 0) == 1)
        pass_rate = pass_count / total_samples if total_samples > 0 else 0.0
        
        # Feature count
        feature_count = 0
        if data:
            sample_features = data[0].get('features', {})
            feature_count = len(sample_features)
        
        # Time span
        timestamps = [point.get('timestamp', '') for point in data if point.get('timestamp')]
        time_span = 0
        if len(timestamps) >= 2:
            try:
                from datetime import datetime
                start_time = datetime.fromisoformat(timestamps[0].replace('Z', '+00:00'))
                end_time = datetime.fromisoformat(timestamps[-1].replace('Z', '+00:00'))
                time_span = (end_time - start_time).total_seconds()
            except:
                time_span = 0
        
        return {
            'total_samples': total_samples,
            'pass_rate': pass_rate,
            'feature_count': feature_count,
            'time_span_seconds': time_span,
            'pass_count': pass_count,
            'fail_count': total_samples - pass_count
        }
