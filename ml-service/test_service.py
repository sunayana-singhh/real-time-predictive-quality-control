"""
Test script for the ML service
"""

import requests
import json
import time
from typing import Dict, Any, List

# Service URL
BASE_URL = "http://localhost:8000"

def test_health():
    """Test health endpoint"""
    print("Testing health endpoint...")
    response = requests.get(f"{BASE_URL}/health")
    print(f"Health check: {response.status_code} - {response.json()}")
    return response.status_code == 200

def create_sample_data() -> Dict[str, Any]:
    """Create sample training data"""
    import random
    
    # Generate sample training data
    training_data = []
    testing_data = []
    
    for i in range(100):
        # Generate random features
        features = {
            'feature1': random.uniform(0, 1),
            'feature2': random.uniform(0, 1),
            'feature3': random.uniform(0, 1),
            'feature4': random.uniform(0, 1),
            'feature5': random.uniform(0, 1)
        }
        
        # Generate response based on features (simple rule)
        response = 1 if (features['feature1'] + features['feature2']) > 1.0 else 0
        
        data_point = {
            'timestamp': f"2021-01-01T{12 + i//60:02d}:{i%60:02d}:00",
            'response': response,
            'features': features
        }
        
        if i < 70:
            training_data.append(data_point)
        else:
            testing_data.append(data_point)
    
    return {
        'trainStart': '2021-01-01T12:00:00',
        'trainEnd': '2021-01-01T13:10:00',
        'testStart': '2021-01-01T13:10:00',
        'testEnd': '2021-01-01T13:30:00',
        'trainingData': training_data,
        'testingData': testing_data
    }

def test_training():
    """Test model training"""
    print("\nTesting model training...")
    
    sample_data = create_sample_data()
    
    response = requests.post(
        f"{BASE_URL}/train",
        json=sample_data,
        headers={'Content-Type': 'application/json'}
    )
    
    print(f"Training response: {response.status_code}")
    if response.status_code == 200:
        result = response.json()
        print(f"Training successful!")
        print(f"Accuracy: {result['accuracy']:.3f}")
        print(f"Precision: {result['precision']:.3f}")
        print(f"Recall: {result['recall']:.3f}")
        print(f"F1-Score: {result['f1Score']:.3f}")
        return True
    else:
        print(f"Training failed: {response.text}")
        return False

def test_single_prediction():
    """Test single prediction"""
    print("\nTesting single prediction...")
    
    sample_features = {
        'feature1': 0.8,
        'feature2': 0.6,
        'feature3': 0.4,
        'feature4': 0.2,
        'feature5': 0.9
    }
    
    response = requests.post(
        f"{BASE_URL}/predict",
        json=sample_features,
        headers={'Content-Type': 'application/json'}
    )
    
    print(f"Prediction response: {response.status_code}")
    if response.status_code == 200:
        result = response.json()
        print(f"Prediction: {result['prediction']}")
        print(f"Confidence: {result['confidence']:.3f}")
        return True
    else:
        print(f"Prediction failed: {response.text}")
        return False

def test_simulation():
    """Test simulation"""
    print("\nTesting simulation...")
    
    # Create simulation data
    simulation_data = []
    for i in range(20):
        features = {
            'feature1': 0.5 + (i * 0.02),
            'feature2': 0.3 + (i * 0.01),
            'feature3': 0.7 - (i * 0.01),
            'feature4': 0.2 + (i * 0.02),
            'feature5': 0.8 - (i * 0.01)
        }
        
        simulation_data.append({
            'timestamp': f"2021-01-01T{14 + i//60:02d}:{i%60:02d}:00",
            'id': i + 1,
            'response': 1 if i % 3 == 0 else 0,
            'features': features
        })
    
    request_data = {
        'simulationStart': '2021-01-01T14:00:00',
        'simulationEnd': '2021-01-01T14:20:00',
        'data': simulation_data
    }
    
    response = requests.post(
        f"{BASE_URL}/simulate",
        json=request_data,
        headers={'Content-Type': 'application/json'}
    )
    
    print(f"Simulation response: {response.status_code}")
    if response.status_code == 200:
        results = response.json()
        print(f"Simulation completed with {len(results)} results")
        
        # Show first few results
        for i, result in enumerate(results[:5]):
            print(f"  {i+1}. {result['sampleId']}: {result['prediction']} (confidence: {result['confidence']:.3f})")
        
        return True
    else:
        print(f"Simulation failed: {response.text}")
        return False

def test_simulation_stats():
    """Test simulation statistics"""
    print("\nTesting simulation statistics...")
    
    response = requests.get(f"{BASE_URL}/simulation/stats")
    
    print(f"Stats response: {response.status_code}")
    if response.status_code == 200:
        stats = response.json()
        print(f"Total predictions: {stats['totalPredictions']}")
        print(f"Pass count: {stats['passCount']}")
        print(f"Fail count: {stats['failCount']}")
        print(f"Average confidence: {stats['averageConfidence']:.3f}")
        return True
    else:
        print(f"Stats failed: {response.text}")
        return False

def test_model_info():
    """Test model info endpoint"""
    print("\nTesting model info...")
    
    response = requests.get(f"{BASE_URL}/model/info")
    
    print(f"Model info response: {response.status_code}")
    if response.status_code == 200:
        info = response.json()
        print(f"Model status: {info['status']}")
        if info.get('metrics'):
            print(f"Model type: {info.get('model_type', 'Unknown')}")
        return True
    else:
        print(f"Model info failed: {response.text}")
        return False

def main():
    """Run all tests"""
    print("🧪 Testing IntelliInspect ML Service")
    print("=" * 50)
    
    tests = [
        ("Health Check", test_health),
        ("Model Training", test_training),
        ("Single Prediction", test_single_prediction),
        ("Simulation", test_simulation),
        ("Simulation Stats", test_simulation_stats),
        ("Model Info", test_model_info)
    ]
    
    results = []
    
    for test_name, test_func in tests:
        try:
            success = test_func()
            results.append((test_name, success))
        except Exception as e:
            print(f"❌ {test_name} failed with exception: {e}")
            results.append((test_name, False))
        
        time.sleep(1)  # Small delay between tests
    
    print("\n" + "=" * 50)
    print("📊 Test Results Summary:")
    print("=" * 50)
    
    passed = 0
    for test_name, success in results:
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{test_name}: {status}")
        if success:
            passed += 1
    
    print(f"\nOverall: {passed}/{len(results)} tests passed")
    
    if passed == len(results):
        print("🎉 All tests passed! ML service is working correctly.")
    else:
        print("⚠️  Some tests failed. Check the service logs.")

if __name__ == "__main__":
    main()
