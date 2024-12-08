import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, classification_report, confusion_matrix
import joblib

# File paths
train_features_file = r'C:/ResearchProject/data/X_train.csv'
train_labels_file = r'C:/ResearchProject/data/y_train.csv'
test_features_file = r'C:/ResearchProject/data/X_test.csv'
test_labels_file = r'C:/ResearchProject/data/y_test.csv'
model_output_file = r'C:/ResearchProject/models/random_forest_model.pkl'

# Load training and testing data
print("Loading training and testing datasets...")
X_train = pd.read_csv(train_features_file)
X_test = pd.read_csv(test_features_file)
y_train = pd.read_csv(train_labels_file).values.ravel()
y_test = pd.read_csv(test_labels_file).values.ravel()

# Train the model
print("Training Random Forest model...")
model = RandomForestClassifier(n_estimators=100, random_state=42)
model.fit(X_train, y_train)
print("Model training complete!")

# Evaluate the model
print("Evaluating the model...")
y_pred = model.predict(X_test)

# Metrics
accuracy = accuracy_score(y_test, y_pred)
conf_matrix = confusion_matrix(y_test, y_pred)
classification_rep = classification_report(y_test, y_pred)

print(f"Accuracy: {accuracy:.2f}")
print("Confusion Matrix:")
print(conf_matrix)
print("\nClassification Report:")
print(classification_rep)

# Save the trained model
print(f"Saving the model to {model_output_file}...")
joblib.dump(model, model_output_file)
print("Model saved successfully!")
