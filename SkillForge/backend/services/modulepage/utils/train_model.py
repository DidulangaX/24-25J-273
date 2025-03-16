#!/usr/bin/env python3
"""
Model Training Script
This script takes a JSON file of training examples and updates the model
"""
import sys
import json
import pickle
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier

def train_model(training_data_path, model_path):
    """Train or update the difficulty detection model"""
    # Load training data
    with open(training_data_path, 'r') as f:
        training_data = json.load(f)
    
    if not training_data:
        print("No training data provided")
        return 1
    
    # Extract features and targets
    X_data = []
    y_data = []
    
    for example in training_data:
        features = example['features']
        target = example['target']
        
        # Ensure we have standardized feature names
        required_features = [
            'session_duration', 'total_pauses', 'pause_median_duration',
            'replay_frequency', 'replay_duration', 'seek_forward_frequency',
            'skipped_content', 'speed_changes', 'average_speed',
            'pause_rate', 'replay_ratio'
        ]
        
        feature_vector = {}
        for feature in required_features:
            feature_vector[feature] = features.get(feature, 0)
        
        X_data.append(feature_vector)
        y_data.append(target)
    
    # Convert to DataFrame and Series
    X = pd.DataFrame(X_data)
    y = pd.Series(y_data)
    
    # Check if existing model exists
    try:
        with open(model_path, 'rb') as f:
            model = pickle.load(f)
        print(f"Loaded existing model from {model_path}")
    except:
        # Create new model if none exists
        model = RandomForestClassifier(
            n_estimators=100,
            max_depth=10,
            random_state=42,
            class_weight='balanced'
        )
        print("Created new model")
    
    # Train the model
    model.fit(X, y)
    
    # Save the updated model
    with open(model_path, 'wb') as f:
        pickle.dump(model, f)
    
    # Evaluate the model on the training data
    accuracy = model.score(X, y)
    feature_importance = dict(zip(X.columns, model.feature_importances_))
    
    # Print metrics
    print(json.dumps({
        "accuracy": accuracy,
        "num_examples": len(X),
        "feature_importance": feature_importance
    }))
    
    return 0

if __name__ == "__main__":
    if len(sys.argv) != 3:
        print("Usage: train_model.py <training_data_path> <model_path>")
        sys.exit(1)
    
    training_data_path = sys.argv[1]
    model_path = sys.argv[2]
    
    try:
        exit_code = train_model(training_data_path, model_path)
        sys.exit(exit_code)
    except Exception as e:
        print(f"Error: {str(e)}")
        sys.exit(1)