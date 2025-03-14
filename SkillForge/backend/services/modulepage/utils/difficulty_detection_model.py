"""
Difficulty Detection Model

This module provides a machine learning model for predicting learning difficulties
based on user interaction patterns with video content, following research insights from
"How Do In-video Interactions Reflect Perceived Video Difficulty?"
"""

import os
import pickle
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score

class DifficultyDetectionModel:
    """
    A model to predict whether a user is having difficulty with content
    based on their video interaction patterns.
    """
    
    def __init__(self, model_path=None):
        """
        Initialize the model.
        
        Args:
            model_path: Path to a saved model file (pickle format)
        """
        self.model = None
        self.model_path = model_path
        
        # Define the features the model expects based on research findings
        self.features = [
            'session_duration',  # Total time spent on the video (seconds)
            'total_pauses',      # Number of times user paused the video
            'pause_rate',        # Pauses per minute
            'pause_median_duration', # Median duration of pauses (seconds)
            'replay_frequency',  # Number of times user replayed sections
            'replay_duration',   # Total time spent on replays (seconds)
            'replay_ratio',      # Portion of time spent on replays
            'seek_forward_frequency', # Number of forward seeks
            'skipped_content',   # Amount of content skipped (seconds)
            'speed_changes',     # Number of speed changes
            'average_speed',     # Average playback speed
        ]
        
        # Load model if path provided
        if model_path and os.path.exists(model_path):
            self.load_model(model_path)
        else:
            # Initialize a new model
            self._initialize_model()
    
    def _initialize_model(self):
        """Initialize a new Random Forest model based on research insights."""
        # Use Random Forest as it handles non-linear relationships well
        # as identified in the research paper
        self.model = RandomForestClassifier(
            n_estimators=100,
            max_depth=10,
            min_samples_split=5,
            min_samples_leaf=2,
            random_state=42,
            class_weight='balanced'  # Handle potential class imbalance
        )
    
    def load_model(self, model_path):
        """
        Load a saved model from disk.
        
        Args:
            model_path: Path to the saved model file
        
        Returns:
            bool: True if successful, False otherwise
        """
        try:
            with open(model_path, 'rb') as f:
                self.model = pickle.load(f)
            return True
        except Exception as e:
            print(f"Error loading model: {str(e)}")
            # Initialize a new model as fallback
            self._initialize_model()
            return False
    
    def save_model(self, model_path=None):
        """
        Save the model to disk.
        
        Args:
            model_path: Path to save the model (uses self.model_path if None)
        
        Returns:
            bool: True if successful, False otherwise
        """
        if model_path is None:
            model_path = self.model_path
        
        # Ensure we have a path
        if model_path is None:
            print("No model path specified")
            return False
        
        try:
            # Create directory if it doesn't exist
            os.makedirs(os.path.dirname(model_path), exist_ok=True)
            
            # Save the model
            with open(model_path, 'wb') as f:
                pickle.dump(self.model, f)
            return True
        except Exception as e:
            print(f"Error saving model: {str(e)}")
            return False
    
    def preprocess_data(self, interaction_data):
        """
        Preprocess interaction data for model input, applying insights from research.
        
        Args:
            interaction_data: Dictionary containing interaction metrics
        
        Returns:
            pandas.DataFrame: Processed data ready for model
        """
        # Extract base metrics
        data = {}
        
        # Start with raw interaction data
        for feature in self.features:
            if feature in interaction_data:
                data[feature] = interaction_data[feature]
        
        # Calculate derived features if not provided
        # Calculate pause rate if missing
        if 'session_duration' in data and 'total_pauses' in data and 'pause_rate' not in data:
            # Convert to pauses per minute as per research
            minutes = data['session_duration'] / 60
            data['pause_rate'] = data['total_pauses'] / max(minutes, 0.1)  # Avoid division by zero
        
        # Calculate replay ratio if missing
        if 'session_duration' in data and 'replay_duration' in data and 'replay_ratio' not in data:
            data['replay_ratio'] = data['replay_duration'] / max(data['session_duration'], 0.1)
        
        # Filter pauses to only consider those between 2 seconds and 10 minutes as per research
        if 'pause_durations' in interaction_data:
            valid_pauses = [p for p in interaction_data['pause_durations'] 
                           if 2 <= p <= 600]  # 2 sec to 10 min in seconds
            
            if valid_pauses:
                if 'pause_median_duration' not in data:
                    data['pause_median_duration'] = np.median(valid_pauses)
                if 'total_pauses' not in data:
                    data['total_pauses'] = len(valid_pauses)
        
        # Handle missing values with defaults based on average expected behaviors
        defaults = {
            'session_duration': 300,  # 5 minutes
            'total_pauses': 0,
            'pause_rate': 0,
            'pause_median_duration': 0,
            'replay_frequency': 0,
            'replay_duration': 0,
            'replay_ratio': 0,
            'seek_forward_frequency': 0,
            'skipped_content': 0,
            'speed_changes': 0,
            'average_speed': 1.0,
        }
        
        # Fill missing values with defaults
        for feature in self.features:
            if feature not in data:
                data[feature] = defaults.get(feature, 0)
        
        return pd.DataFrame([data])
    
    def train(self, X, y):
        """
        Train the model with interaction data and difficulty labels.
        
        Args:
            X: pandas.DataFrame or dict of interaction features
            y: array-like of difficulty labels (0=not difficult, 1=difficult)
            
        Returns:
            dict: Training metrics
        """
        # Convert to DataFrame if dict
        if isinstance(X, dict):
            X = pd.DataFrame([X])
        
        # Ensure we have all required features
        for feature in self.features:
            if feature not in X.columns:
                X[feature] = 0  # Default value
        
        # Train the model
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.2, random_state=42, stratify=y
        )
        
        self.model.fit(X_train, y_train)
        
        # Evaluate the model
        y_pred = self.model.predict(X_test)
        
        metrics = {
            'accuracy': accuracy_score(y_test, y_pred),
            'precision': precision_score(y_test, y_pred, zero_division=0),
            'recall': recall_score(y_test, y_pred, zero_division=0),
            'f1_score': f1_score(y_test, y_pred, zero_division=0),
            'feature_importance': dict(zip(self.features, self.model.feature_importances_))
        }
        
        return metrics
    
    def update_model(self, new_X, new_y):
        """
        Update the model with new data (incremental learning).
        
        Args:
            new_X: New interaction data
            new_y: New difficulty labels
            
        Returns:
            dict: Updated model metrics
        """
        # If we don't have a model yet, just train from scratch
        if self.model is None:
            return self.train(new_X, new_y)
        
        # Convert to DataFrame if dict
        if isinstance(new_X, dict):
            new_X = pd.DataFrame([new_X])
        
        # Ensure we have all required features
        for feature in self.features:
            if feature not in new_X.columns:
                new_X[feature] = 0  # Default value
        
        # For Random Forest, we need to retrain with all data
        # In a production system, you might store previous data or use ensemble methods
        # Here we'll just retrain with the new data
        self.model.fit(new_X, new_y)
        
        # Simple evaluation on the new data
        y_pred = self.model.predict(new_X)
        
        metrics = {
            'accuracy': accuracy_score(new_y, y_pred),
            'precision': precision_score(new_y, y_pred, zero_division=0),
            'recall': recall_score(new_y, y_pred, zero_division=0),
            'f1_score': f1_score(new_y, y_pred, zero_division=0),
            'feature_importance': dict(zip(self.features, self.model.feature_importances_))
        }
        
        return metrics
    
    def predict(self, interaction_data):
        """
        Predict difficulty based on interaction data.
        
        Args:
            interaction_data: Dictionary or DataFrame of interaction metrics
            
        Returns:
            dict: Prediction results with confidence
        """
        if self.model is None:
            return {
                'predicted_difficulty': 0,
                'confidence': 0,
                'error': 'Model not trained'
            }
        
        # Preprocess the data
        if isinstance(interaction_data, dict):
            X = self.preprocess_data(interaction_data)
        else:
            X = interaction_data
        
        # Make prediction
        difficulty = self.model.predict(X)[0]
        
        # Get confidence (probability)
        probabilities = self.model.predict_proba(X)[0]
        confidence = probabilities[1] if difficulty == 1 else probabilities[0]
        
        # Calculate feature insights based on feature importance
        feature_importance = dict(zip(self.features, self.model.feature_importances_))
        
        # Get top contributing features
        features_df = pd.DataFrame({
            'feature': self.features,
            'value': X.iloc[0].values,
            'importance': self.model.feature_importances_
        })
        features_df['contribution'] = features_df['value'] * features_df['importance']
        contributing_features = features_df.sort_values('contribution', ascending=False).head(3)
        
        # Incorporate research insights for specific features
        insights = []
        
        if difficulty == 1:  # If predicted difficult
            # Check for patterns identified in research
            if X['total_pauses'].iloc[0] > 5:
                insights.append("High number of pauses detected, suggesting difficulty with content")
            
            if X['pause_median_duration'].iloc[0] > 30:
                insights.append("Long pauses suggest user is struggling with complex concepts")
            
            if X['replay_ratio'].iloc[0] > 0.2:
                insights.append("Significant content replayed, suggesting difficulty understanding key points")
            
            if X['average_speed'].iloc[0] < 1.0:
                insights.append("Reduced playback speed suggests content is challenging")
                
            if X['skipped_content'].iloc[0] > 0 and X['seek_forward_frequency'].iloc[0] <= 2:
                insights.append("Large content skips with few seek events may indicate giving up on difficult sections")
        else:  # If predicted not difficult
            if X['average_speed'].iloc[0] > 1.25:
                insights.append("Increased playback speed suggests comfortable understanding of content")
                
            if X['seek_forward_frequency'].iloc[0] > 5 and X['skipped_content'].iloc[0] > 0:
                insights.append("Multiple small skips suggest efficient navigation of familiar content")
        
        return {
            'predicted_difficulty': int(difficulty),
            'confidence': float(confidence),
            'probability_difficult': float(probabilities[1]),
            'top_factors': contributing_features[['feature', 'contribution']].to_dict('records'),
            'insights': insights
        }

# Example usage to create initial training data based on research findings
def generate_synthetic_data(num_samples=1000):
    """
    Generate synthetic training data based on research findings.
    This helps bootstrap the model until real user data is collected.
    
    Args:
        num_samples: Number of samples to generate
        
    Returns:
        X: DataFrame of features
        y: Series of labels
    """
    np.random.seed(42)
    
    # Create arrays for storing data
    data = []
    labels = []
    
    # Generate easy videos (not difficult)
    for _ in range(num_samples // 2):
        # Based on research findings, these patterns suggest not difficult content
        session = {
            'session_duration': np.random.uniform(180, 1200),  # 3-20 minutes
            'total_pauses': np.random.randint(0, 4),
            'pause_median_duration': np.random.uniform(0, 20),
            'replay_frequency': np.random.randint(0, 3),
            'replay_duration': np.random.uniform(0, 60),
            'seek_forward_frequency': np.random.randint(3, 10),
            'skipped_content': np.random.uniform(30, 180),
            'speed_changes': np.random.randint(0, 2),
            'average_speed': np.random.uniform(1.0, 2.0),
        }
        
        # Calculate derived metrics
        minutes = session['session_duration'] / 60
        session['pause_rate'] = session['total_pauses'] / max(minutes, 0.1)
        session['replay_ratio'] = session['replay_duration'] / max(session['session_duration'], 0.1)
        
        data.append(session)
        labels.append(0)  # Not difficult
    
    # Generate difficult videos
    for _ in range(num_samples // 2):
        # Based on research findings, these patterns suggest difficult content
        session = {
            'session_duration': np.random.uniform(180, 1200),  # 3-20 minutes
            'total_pauses': np.random.randint(5, 15),
            'pause_median_duration': np.random.uniform(20, 120),
            'replay_frequency': np.random.randint(3, 8),
            'replay_duration': np.random.uniform(60, 300),
            'seek_forward_frequency': np.random.randint(0, 3),
            'skipped_content': np.random.uniform(0, 60),
            'speed_changes': np.random.randint(1, 4),
            'average_speed': np.random.uniform(0.75, 1.0),
        }
        
        # Calculate derived metrics
        minutes = session['session_duration'] / 60
        session['pause_rate'] = session['total_pauses'] / max(minutes, 0.1)
        session['replay_ratio'] = session['replay_duration'] / max(session['session_duration'], 0.1)
        
        data.append(session)
        labels.append(1)  # Difficult
    
    # Convert to DataFrame and Series
    X = pd.DataFrame(data)
    y = pd.Series(labels)
    
    return X, y

if __name__ == "__main__":
    # Example of how to initialize and use the model
    model = DifficultyDetectionModel()
    
    # Generate synthetic data based on research findings
    X, y = generate_synthetic_data(1000)
    
    # Train the model
    metrics = model.train(X, y)
    print(f"Model trained with metrics: {metrics}")
    
    # Example prediction
    example_interaction = {
        'session_duration': 600,  # 10 minutes
        'total_pauses': 8,
        'pause_median_duration': 45,
        'replay_frequency': 4,
        'replay_duration': 120,
        'seek_forward_frequency': 1,
        'skipped_content': 30,
        'speed_changes': 2,
        'average_speed': 0.9,
    }
    
    prediction = model.predict(example_interaction)
    print(f"Prediction: {prediction}")
    
    # Save the model
    model.save_model("models/difficulty_detection_model.pkl")