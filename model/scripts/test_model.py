import pandas as pd
import joblib

# File paths
model_file = r'C:/ResearchProject/models/random_forest_model.pkl'
test_features_file = r'C:/ResearchProject/data/X_test.csv'
output_predictions_file = r'C:/ResearchProject/outputs/test_predictions.csv'

# Load the trained model
print("Loading the trained model...")
model = joblib.load(model_file)
print("Model loaded successfully!")

# Load test data
print("Loading test data...")
X_test = pd.read_csv(test_features_file)

# Make predictions
print("Making predictions on test data...")
predictions = model.predict(X_test)

# Save predictions to file
print(f"Saving predictions to {output_predictions_file}...")
pd.DataFrame(predictions, columns=['prediction']).to_csv(output_predictions_file, index=False)
print("Predictions saved successfully!")
