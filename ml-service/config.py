"""
Configuration settings for the ML service
"""

import os
from typing import Dict, Any

class Config:
    """Configuration class for ML service"""
    
    # Model parameters
    MODEL_PARAMS = {
        'n_estimators': int(os.getenv('XGB_N_ESTIMATORS', 100)),
        'max_depth': int(os.getenv('XGB_MAX_DEPTH', 6)),
        'learning_rate': float(os.getenv('XGB_LEARNING_RATE', 0.1)),
        'random_state': int(os.getenv('XGB_RANDOM_STATE', 42)),
        'eval_metric': os.getenv('XGB_EVAL_METRIC', 'logloss'),
        'subsample': float(os.getenv('XGB_SUBSAMPLE', 0.8)),
        'colsample_bytree': float(os.getenv('XGB_COLSAMPLE_BYTREE', 0.8))
    }
    
    # Data processing parameters
    DATA_PARAMS = {
        'min_samples_for_training': int(os.getenv('MIN_SAMPLES_TRAINING', 100)),
        'max_features': int(os.getenv('MAX_FEATURES', 1000)),
        'missing_value_strategy': os.getenv('MISSING_VALUE_STRATEGY', 'fill_zero')
    }
    
    # Simulation parameters
    SIMULATION_PARAMS = {
        'batch_size': int(os.getenv('SIMULATION_BATCH_SIZE', 100)),
        'delay_between_predictions': float(os.getenv('PREDICTION_DELAY', 0.1)),
        'max_simulation_samples': int(os.getenv('MAX_SIMULATION_SAMPLES', 10000))
    }
    
    # File paths
    MODEL_SAVE_PATH = os.getenv('MODEL_SAVE_PATH', '/app/data/trained_model.pkl')
    DATA_DIR = os.getenv('DATA_DIR', '/app/data')
    
    # API settings
    API_SETTINGS = {
        'max_request_size': int(os.getenv('MAX_REQUEST_SIZE', 50 * 1024 * 1024)),  # 50MB
        'timeout_seconds': int(os.getenv('REQUEST_TIMEOUT', 300)),  # 5 minutes
        'enable_cors': os.getenv('ENABLE_CORS', 'true').lower() == 'true'
    }
    
    # Logging settings
    LOG_LEVEL = os.getenv('LOG_LEVEL', 'INFO')
    LOG_FORMAT = os.getenv('LOG_FORMAT', '%(asctime)s - %(name)s - %(levelname)s - %(message)s')
    
    @classmethod
    def get_model_params(cls) -> Dict[str, Any]:
        """Get model parameters"""
        return cls.MODEL_PARAMS.copy()
    
    @classmethod
    def get_data_params(cls) -> Dict[str, Any]:
        """Get data processing parameters"""
        return cls.DATA_PARAMS.copy()
    
    @classmethod
    def get_simulation_params(cls) -> Dict[str, Any]:
        """Get simulation parameters"""
        return cls.SIMULATION_PARAMS.copy()
    
    @classmethod
    def validate_config(cls) -> bool:
        """Validate configuration settings"""
        try:
            # Validate model parameters
            assert cls.MODEL_PARAMS['n_estimators'] > 0
            assert cls.MODEL_PARAMS['max_depth'] > 0
            assert 0 < cls.MODEL_PARAMS['learning_rate'] <= 1
            assert cls.MODEL_PARAMS['random_state'] >= 0
            
            # Validate data parameters
            assert cls.DATA_PARAMS['min_samples_for_training'] > 0
            assert cls.DATA_PARAMS['max_features'] > 0
            
            # Validate simulation parameters
            assert cls.SIMULATION_PARAMS['batch_size'] > 0
            assert cls.SIMULATION_PARAMS['delay_between_predictions'] >= 0
            assert cls.SIMULATION_PARAMS['max_simulation_samples'] > 0
            
            return True
        except AssertionError:
            return False
