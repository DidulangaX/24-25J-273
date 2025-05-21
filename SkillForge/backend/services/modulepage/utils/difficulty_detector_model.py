#!/usr/bin/env python
"""
Difficulty Detector Model
This script predicts learning difficulties based on video interaction patterns.
"""
import sys
import json
import os
import pickle
import traceback
import numpy as np

def predict_difficulty(input_data):
    """
    Predict difficulty based on video interaction metrics
    
    Args:
        input_data (dict): Dictionary of interaction metrics
        
    Returns:
        dict: Prediction results with confidence and insights
    """
    try:
        # Determine model directory path
        script_dir = os.path.dirname(os.path.abspath(__file__))
        model_dir = os.path.join(os.path.dirname(script_dir), "models", "ml-models")
        
        # Paths to model files
        model_path = os.path.join(model_dir, "difficulty_detection_model.pkl")
        scaler_path = os.path.join(model_dir, "feature_scaler.pkl")
        features_path = os.path.join(model_dir, "feature_names.pkl")
        
        # Debug output
        print(f"Looking for model at: {model_path}", file=sys.stderr)
        print(f"Input data keys: {list(input_data.keys())}", file=sys.stderr)
        
        # Check if files exist
        if not os.path.exists(model_path):
            print(f"Model file not found at: {model_path}", file=sys.stderr)
            return {
                "predicted_difficulty": 0,
                "confidence": 0.5,
                "insights": ["Model file not found - please run model setup"],
                "error": f"Model file not found at: {model_path}"
            }
            
        # Load model and associated files
        with open(model_path, 'rb') as f:
            model = pickle.load(f)
        with open(scaler_path, 'rb') as f:
            scaler = pickle.load(f)
        with open(features_path, 'rb') as f:
            feature_names = pickle.load(f)
            
        # Debug output
        print(f"Successfully loaded model and features: {feature_names}", file=sys.stderr)
        
        # Extract features in correct order
        features_data = []
        for feature in feature_names:
            # Get feature value, defaulting to 0 if not present
            value = float(input_data.get(feature, 0))
            features_data.append(value)
            
        # Scale features
        input_array = np.array([features_data])
        scaled_features = scaler.transform(input_array)
        
        # Make prediction
        prediction = model.predict(scaled_features)[0]
        proba = model.predict_proba(scaled_features)[0]
        confidence = float(proba[1] if prediction == 1 else proba[0])
        
        # Debug output
        print(f"Prediction: {prediction}, Confidence: {confidence}", file=sys.stderr)
        
        # Generate insights
        insights = []
        if prediction == 1:  # Difficult
            if input_data.get('replay_frequency', 0) > 2:
                insights.append("Multiple content replays suggest challenging concepts")
            
            if input_data.get('pause_rate', 0) > 3:
                insights.append("High frequency of pauses indicates difficulty with content")
                
            if input_data.get('tab_switch_frequency', 0) > 2:
                insights.append("Frequent tab switching suggests seeking additional resources")
                
            if input_data.get('tab_visibility_ratio', 1) < 0.8:
                insights.append("Low content visibility suggests external research was needed")
                
            if not insights:
                insights.append("Your viewing pattern suggests you may find this content challenging")
        else:
            if input_data.get('seek_forward_frequency', 0) > 3:
                insights.append("Skipping forward suggests familiarity with content")
                
            if input_data.get('active_viewing_ratio', 0) > 0.8:
                insights.append("High engagement suggests comfortable understanding")
                
            if not insights:
                insights.append("Your viewing pattern suggests appropriate difficulty level")
                
        # Return prediction results
        return {
            "predicted_difficulty": int(prediction),
            "confidence": confidence,
            "insights": insights,
            "difficulty_score": float(confidence * 100)
        }
        
    except Exception as e:
        error_info = traceback.format_exc()
        print(f"Error in prediction script: {str(e)}\n{error_info}", file=sys.stderr)
        return {
            "predicted_difficulty": 0,
            "confidence": 0.5,
            "insights": ["Error in difficulty prediction"],
            "error": str(e)
        }

def main():
    try:
        # Check if input is provided from command line
        if len(sys.argv) > 1:
            # First argument is path to JSON file with data
            input_file = sys.argv[1]
            with open(input_file, 'r') as f:
                input_data = json.load(f)
        else:
            # Read from stdin
            input_str = sys.stdin.read().strip()
            if not input_str:
                print(json.dumps({
                    "predicted_difficulty": 0,
                    "confidence": 0.5,
                    "insights": ["No input data provided"]
                }))
                return 1
            input_data = json.loads(input_str)
            
        # Make prediction
        prediction = predict_difficulty(input_data)
        
        # Output prediction as JSON
        print(json.dumps(prediction))
        return 0
        
    except Exception as e:
        error_info = traceback.format_exc()
        print(f"Error in main: {str(e)}\n{error_info}", file=sys.stderr)
        print(json.dumps({
            "predicted_difficulty": 0,
            "confidence": 0.5,
            "insights": ["Error in difficulty prediction"],
            "error": str(e)
        }))
        return 1

if __name__ == "__main__":
    sys.exit(main())