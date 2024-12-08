import pandas as pd
from sklearn.model_selection import train_test_split

# File paths
input_file = r'C:/ResearchProject/data/custom_dataset.csv'
train_features_file = r'C:/ResearchProject/data/X_train.csv'
train_labels_file = r'C:/ResearchProject/data/y_train.csv'
test_features_file = r'C:/ResearchProject/data/X_test.csv'
test_labels_file = r'C:/ResearchProject/data/y_test.csv'

# Load the dataset
print("Loading dataset...")
df = pd.read_csv(input_file)

# Separate features and target
X = df.drop(columns=['difficulty'])
y = df['difficulty']

# Split the dataset
print("Splitting dataset into training and testing sets...")
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

# Save splits
print("Saving split datasets...")
X_train.to_csv(train_features_file, index=False)
y_train.to_csv(train_labels_file, index=False)
X_test.to_csv(test_features_file, index=False)
y_test.to_csv(test_labels_file, index=False)

print("Dataset splitting complete!")
