import dill
import pandas as pd
import ast
import numpy as np


# --- Feature functions (must match training) ---
def has_non_empty_return(code_str):
    try:
        tree = ast.parse(code_str)
        for node in ast.walk(tree):
            if isinstance(node, ast.Return):
                if node.value is not None:
                    return 1
        return 0
    except SyntaxError:
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
    return code_str.count('\n')

def presence_of_keyword(code_str, keyword):
    return 1 if keyword.lower() in code_str.lower() else 0

def compute_extra_features(df_in):
    df_out = df_in.copy()
    df_out['parse_success'] = df_out['user_answer'].apply(can_parse_code)
    df_out['lines_of_code'] = df_out['user_answer'].apply(count_lines_of_code)
    df_out['has_return']    = df_out['user_answer'].apply(lambda x: presence_of_keyword(x, 'return'))
    df_out['has_def']       = df_out['user_answer'].apply(lambda x: presence_of_keyword(x, 'def'))
    df_out['has_class']     = df_out['user_answer'].apply(lambda x: presence_of_keyword(x, 'class'))
    df_out['has_if']        = df_out['user_answer'].apply(lambda x: presence_of_keyword(x, 'if'))
    df_out['has_for']       = df_out['user_answer'].apply(lambda x: presence_of_keyword(x, 'for'))
    df_out['has_non_empty_return'] = df_out['user_answer'].apply(has_non_empty_return)
    df_out['merged_text'] = (
        df_out['Instruction'].fillna('') + " " +
        df_out['Input'].fillna('') + " " +
        df_out['user_answer'].fillna('')
    )
    return df_out

# --- Load the model ---
with open('my_final_model.pkl', 'rb') as f:
    model = dill.load(f)

# --- Create a test DataFrame (mimicking inference input) ---
df_test_raw = pd.DataFrame([{
    'Instruction': 'Write a function to add two numbers',
    'Input': '',
    'user_answer': 'def add(a, b):\n    return a + b'
}])

# --- Compute features (exactly as in training) ---
df_test = compute_extra_features(df_test_raw)

# --- Make a prediction ---
try:
    pred = model.predict(df_test)
    # After `pred = model.predict(...)`
    label_map = {0: "Incomplete Answer", 1: "Syntax Error", 2: "correct"}
    print("Predicted label (numeric):", pred)
    print("Predicted label (text):", label_map[pred[0]])

    print("Model prediction:", pred)
except Exception as e:
    print("Error during model.predict:", e)
