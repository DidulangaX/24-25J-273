#!/usr/bin/env python
"""
Model File Converter

This script handles the conversion and setup of model files for the difficulty detection system.
Run this script from your backend directory to set up temporary model files.
"""
import os
import pickle
import sys
import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import StandardScaler

def create_model_files():
    """Create temporary model files for development until real model files are available."""
    print("Creating temporary model files...")
    
    # Define directory for model files
    model_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "models", "ml-models")
    os.makedirs(model_dir, exist_ok=True)
    
    # Feature names that match your system's expected features
    feature_names = [
        "session_duration",
        "total_pauses",
        "pause_median_duration",
        "replay_frequency",
        "replay_duration",
        "seek_forward_frequency",
        "skipped_content",
        "speed_changes",
        "average_speed",
        "pause_rate",
        "replay_ratio",
        "tab_switch_frequency",
        "total_inactivity_time",
        "inactivity_ratio",
        "tab_visibility_ratio",
        "session_exit_attempts",
        "active_viewing_ratio"
    ]
    
    # Create a simple random forest model
    print("Training temporary model...")
    model = RandomForestClassifier(n_estimators=50, max_depth=10, random_state=42)
    
    # Generate synthetic training data
    num_samples = 1000
    X = np.random.rand(num_samples, len(feature_names))
    
    # Generate labels based on simple rules
    y = np.zeros(num_samples, dtype=int)
    
    for i in range(num_samples):
        # Higher pause rate, replay frequency, and tab switching make content more difficult
        difficulty_score = (
            X[i, 1] * 2 +  # total_pauses
            X[i, 3] * 3 +  # replay_frequency
            X[i, 11] * 4 + # tab_switch_frequency
            X[i, 13] * 2 - # inactivity_ratio
            X[i, 14] * 3   # tab_visibility_ratio (inverted effect)
        )
        y[i] = 1 if difficulty_score > 3 else 0
    
    # Train the model
    model.fit(X, y)
    
    # Create and fit a scaler
    scaler = StandardScaler()
    scaler.fit(X)
    
    # Save the model files
    model_path = os.path.join(model_dir, "difficulty_detection_model.pkl")
    scaler_path = os.path.join(model_dir, "feature_scaler.pkl")
    features_path = os.path.join(model_dir, "feature_names.pkl")
    
    with open(model_path, 'wb') as f:
        pickle.dump(model, f)
    
    with open(scaler_path, 'wb') as f:
        pickle.dump(scaler, f)
    
    with open(features_path, 'wb') as f:
        pickle.dump(feature_names, f)
    
    print(f"Model files created at: {model_dir}")
    print(f"- Model: {os.path.exists(model_path)}")
    print(f"- Scaler: {os.path.exists(scaler_path)}")
    print(f"- Features: {os.path.exists(features_path)}")

def main():
    create_model_files()
    return 0

if __name__ == "__main__":
    sys.exit(main())