#!/usr/bin/env python
"""
Difficulty Detector Bridge Script

This script serves as a bridge between the Node.js backend and
the Python-based difficulty detection model.
"""

import os
import sys
import json
import argparse
import pickle
import numpy as np
import pandas as pd

# Add the parent directory to sys.path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Import the difficulty detection model
try:
    from backend.utils.difficulty_detection_model import DifficultyDetectionModel
except ImportError:
    # If the model file is in the same directory, try direct import
    try:
        from difficulty_detection_model import DifficultyDetectionModel
    except ImportError:
        sys.stderr.write("Error: Could not import DifficultyDetectionModel\n")
        sys.exit(1)

def predict_difficulty(args):
    """
    Make a prediction using the difficulty detection model.
    
    Args:
        args: Command-line arguments
        
    Returns:
        None (writes prediction to output file)
    """
    try:
        # Load the model
        model = DifficultyDetectionModel(args.model)
        
        # Read input data
        with open(args.input, 'r') as f:
            interaction_data = json.load(f)
        
        # Make prediction
        prediction = model.predict(interaction_data)
        
        # Write prediction to output file
        with open(args.output, 'w') as f:
            json.dump(prediction, f)
        
    except Exception as e:
        sys.stderr.write(f"Error in predict_difficulty: {str(e)}\n")
        sys.exit(1)

def update_model(args):
    """
    Update the model with new data.
    
    Args:
        args: Command-line arguments
        
    Returns:
        None (prints result to stdout)
    """
    try:
        # Load the model
        model = DifficultyDetectionModel(args.model)
        
        # Read input data
        with open(args.input, 'r') as f:
            data = json.load(f)
        
        # Extract features and target
        features = {k: v for k, v in data.items() if k != 'reported_difficulty'}
        target = data.get('reported_difficulty', 0)
        
        # Update the model
        metrics = model.update_model(features, [target])
        
        # Save the updated model
        model.save_model(args.model)
        
        # Output metrics as JSON
        print(json.dumps({
            'success': True,
            'metrics': metrics
        }))
        
    except Exception as e:
        sys.stderr.write(f"Error in update_model: {str(e)}\n")
        sys.exit(1)

def train_model(args):
    """
    Train a new model or retrain an existing one.
    
    Args:
        args: Command-line arguments
        
    Returns:
        None (prints result to stdout)
    """
    try:
        # Initialize model
        model = DifficultyDetectionModel(args.model if os.path.exists(args.model) else None)
        
        # Generate synthetic data if no training data provided
        if args.data is None:
            from difficulty_detection_model import generate_synthetic_data
            X, y = generate_synthetic_data(1000)
        else:
            # Load training data
            with open(args.data, 'r') as f:
                training_data = json.load(f)
            
            # Prepare features and targets
            X = pd.DataFrame([{k: v for k, v in item.items() if k != 'reported_difficulty'} 
                             for item in training_data])
            y = pd.Series([item.get('reported_difficulty', 0) for item in training_data])
        
        # Train the model
        metrics = model.train(X, y)
        
        # Save the model
        model.save_model(args.model)
        
        # Output metrics as JSON
        print(json.dumps({
            'success': True,
            'metrics': metrics
        }))
        
    except Exception as e:
        sys.stderr.write(f"Error in train_model: {str(e)}\n")
        sys.exit(1)

def main():
    """Main function to parse arguments and call appropriate function."""
    parser = argparse.ArgumentParser(description='Difficulty Detection Bridge Script')
    
    # Required arguments
    parser.add_argument('--mode', required=True, 
                        choices=['predict', 'update', 'train'],
                        help='Operation mode: predict, update, or train')
    parser.add_argument('--model', required=True,
                        help='Path to the model file')
    
    # Optional arguments
    parser.add_argument('--input', help='Path to input data file')
    parser.add_argument('--output', help='Path to output file for predictions')
    parser.add_argument('--data', help='Path to training data file')
    
    args = parser.parse_args()
    
    # Validate arguments based on mode
    if args.mode == 'predict':
        if not args.input or not args.output:
            sys.stderr.write("Error: predict mode requires --input and --output arguments\n")
            sys.exit(1)
        predict_difficulty(args)
    
    elif args.mode == 'update':
        if not args.input:
            sys.stderr.write("Error: update mode requires --input argument\n")
            sys.exit(1)
        update_model(args)
    
    elif args.mode == 'train':
        train_model(args)

if __name__ == "__main__":
    main()