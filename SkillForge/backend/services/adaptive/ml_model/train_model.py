import pandas as pd
import numpy as np
import ast
import os
import dill
import pandas as pd

# 1) Load your CSV into a DataFrame
df = pd.read_csv("processed_dataset.csv")


from sklearn.pipeline import Pipeline, FeatureUnion
from sklearn.base import BaseEstimator, TransformerMixin
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.preprocessing import LabelEncoder
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, confusion_matrix

# If needed:
# df = pd.read_csv('processed_dataset.csv')

###################################################
# 1) Additional feature: has_non_empty_return
###################################################
def has_non_empty_return(code_str):
    """
    Returns 1 if we find at least one 'return' node with a non-None value.
    Returns 0 if there's no return or if all return nodes are empty (None).
    We'll treat that as potentially 'incomplete.'
    """
    try:
        tree = ast.parse(code_str)
        for node in ast.walk(tree):
            if isinstance(node, ast.Return):
                if node.value is not None:
                    return 1
        return 0
    except SyntaxError:
        # If it doesn't parse at all, let this feature be 0
        return 0

def can_parse_code(code_str):
    try:
        ast.parse(code_str)
        return 1
    except SyntaxError:
        return 0

def count_lines_of_code(code_str):
    if not code_str.strip():
        return 0
    return code_str.count('\n') + 1

def presence_of_keyword(code_str, keyword):
    return 1 if keyword.lower() in code_str.lower() else 0

def compute_extra_features(df_in):
    """
    Adds all the numeric features used so far, plus has_non_empty_return.
    """
    df_out = df_in.copy()
    df_out['parse_success'] = df_out['user_answer'].apply(can_parse_code)
    df_out['lines_of_code'] = df_out['user_answer'].apply(count_lines_of_code)
    df_out['has_return']    = df_out['user_answer'].apply(lambda x: presence_of_keyword(x, 'return'))
    df_out['has_def']       = df_out['user_answer'].apply(lambda x: presence_of_keyword(x, 'def'))
    df_out['has_class']     = df_out['user_answer'].apply(lambda x: presence_of_keyword(x, 'class'))
    df_out['has_if']        = df_out['user_answer'].apply(lambda x: presence_of_keyword(x, 'if'))
    df_out['has_for']       = df_out['user_answer'].apply(lambda x: presence_of_keyword(x, 'for'))

    # Our new feature
    df_out['has_non_empty_return'] = df_out['user_answer'].apply(has_non_empty_return)

    return df_out

# ------------------------------------------------------
# 2) Prepare dataset
# ------------------------------------------------------
df['user_answer'] = df['user_answer'].fillna("")
df['Instruction'] = df['Instruction'].fillna("")
df['Input']       = df['Input'].fillna("")

df['merged_text'] = (
    df['Instruction'].astype(str) + " "
    + df['Input'].astype(str) + " "
    + df['user_answer'].astype(str)
)

df_clean = df.dropna(subset=['answer_type']).copy()

label_encoder = LabelEncoder()
df_clean['label'] = label_encoder.fit_transform(df_clean['answer_type'])

# ------------------------------------------------------
# 3) Compute the new features
# ------------------------------------------------------
df_feat = compute_extra_features(df_clean)

# We'll define the numeric columns to use in FeatureUnion
numeric_cols = [
    'parse_success',
    'lines_of_code',
    'has_return',
    'has_def',
    'has_class',
    'has_if',
    'has_for',
    'has_non_empty_return',  # NEW
]

# ------------------------------------------------------
# 4) Pipeline for text + numeric
# ------------------------------------------------------
class ColumnSelector(BaseEstimator, TransformerMixin):
    def __init__(self, column_name):
        self.column_name = column_name
    def fit(self, X, y=None):
        return self
    def transform(self, X):
        return X[self.column_name].values

class NumericFeatureSelector(BaseEstimator, TransformerMixin):
    def __init__(self, col_list):
        self.col_list = col_list
    def fit(self, X, y=None):
        return self
    def transform(self, X):
        return X[self.col_list].values.astype(np.float32)

from sklearn.pipeline import Pipeline
from sklearn.pipeline import FeatureUnion

text_pipeline = Pipeline([
    ('colsel', ColumnSelector('merged_text')),
    ('tfidf', TfidfVectorizer())
])

numeric_pipeline = Pipeline([
    ('numsel', NumericFeatureSelector(numeric_cols))
])

combined_features = FeatureUnion(
    transformer_list=[
        ('text', text_pipeline),
        ('numeric', numeric_pipeline)
    ],
    n_jobs=1
)


model_pipeline = Pipeline([
    ('features', combined_features),
    ('clf', LogisticRegression(max_iter=1000))
])

# ------------------------------------------------------
# 5) Train/test split & Train
# ------------------------------------------------------
X = df_feat
y = df_feat['label']

X_train, X_test, y_train, y_test = train_test_split(
    X, y,
    test_size=0.2,
    random_state=42,
    stratify=y
)

model_pipeline.fit(X_train, y_train)

# ------------------------------------------------------
# 6) Evaluate
# ------------------------------------------------------
y_pred = model_pipeline.predict(X_test)

print("Label Mapping:")
for i, class_name in enumerate(label_encoder.classes_):
    print(f"{i}: {class_name}")

print("\nClassification Report (Added has_non_empty_return):")
print(classification_report(y_test, y_pred, target_names=label_encoder.classes_))

cm = confusion_matrix(y_test, y_pred)
print("Confusion Matrix (rows=actual, cols=pred):")
print(cm)

import dill
with open('my_final_model.pkl', 'wb') as f:
    dill.dump(model_pipeline, f)

import dill

# after training
with open('my_final_model.pkl', 'wb') as f:
    dill.dump(model_pipeline, f)
print("Saved model to my_final_model.pkl, size:", os.path.getsize('my_final_model.pkl'))


