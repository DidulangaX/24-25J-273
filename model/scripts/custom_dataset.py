import pandas as pd
import numpy as np

# Parameters for dataset generation
num_sessions = 10000  # Total number of sessions
random_seed = 42  # For reproducibility

# Set random seed
np.random.seed(random_seed)

# Generate synthetic data
print("Generating synthetic dataset...")
data = {
    'enroll_id': np.arange(1, num_sessions + 1),
    'session_duration': np.random.randint(300, 3600, size=num_sessions),  # 5 mins to 1 hour
    'total_pauses': np.random.randint(0, 10, size=num_sessions),
    'replay_frequency': np.random.randint(0, 5, size=num_sessions),
    'replay_duration': np.random.randint(0, 500, size=num_sessions),  # 0 to ~8 mins
    'skipped_content': np.random.randint(0, 500, size=num_sessions),  # 0 to ~8 mins
    'avg_hour': np.random.randint(0, 24, size=num_sessions),
    'avg_day_of_week': np.random.randint(0, 7, size=num_sessions),
}

# Create a DataFrame
df = pd.DataFrame(data)

# Define the 'difficulty' target variable
print("Defining 'difficulty' labels...")
df['difficulty'] = (
    (df['total_pauses'] > 5) | 
    (df['replay_duration'] > 300) | 
    (df['skipped_content'] > 0.2 * df['session_duration'])
).astype(int)

# Save the dataset
output_file = r'C:/ResearchProject/data/custom_dataset.csv'
print(f"Saving dataset to {output_file}...")
df.to_csv(output_file, index=False)
print("Dataset generated successfully!")
