import pandas as pd
import joblib

# File paths
model_file = r'C:/ResearchProject/models/random_forest_model.pkl'

# Simulated data
print("Testing on simulated data...")
simulated_data = pd.DataFrame({
    'session_duration': [800, 500, 1200],
    'total_pauses': [2, 8, 3],
    'replay_frequency': [1, 0, 4],
    'replay_duration': [50, 400, 200],
    'skipped_content': [10, 300, 50],
    'avg_hour': [14, 16, 10],
    'avg_day_of_week': [3, 5, 2],
    'enroll_id': [0, 0, 0]  # Add dummy 'enroll_id' to align with model's features
})

# Load the trained model
print("Loading the trained model...")
model = joblib.load(model_file)
print("Model loaded successfully!")

# Align feature names with training data
print("Aligning feature names...")
required_features = model.feature_names_in_  # List of features used during training
simulated_data = simulated_data[required_features]  # Reorder and filter columns

# Make predictions
print("Making predictions...")
predictions = model.predict(simulated_data)
print("Simulated data predictions:")
print(predictions)
