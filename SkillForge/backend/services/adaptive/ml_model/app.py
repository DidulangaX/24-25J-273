# app.py
from flask import Flask, request, jsonify
from flask_cors import CORS
import dill
import pandas as pd
import numpy as np
import os
import logging

# Configure logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)


app = Flask(__name__)
CORS(app)  # Enable CORS

# Load the trained model
MODEL_PATH = 'my_final_model.pkl'

if not os.path.exists(MODEL_PATH):
    raise FileNotFoundError(f"The model file {MODEL_PATH} does not exist. Please place it in the ml-service folder.")

with open(MODEL_PATH, 'rb') as f:
    model = dill.load(f)

# Define label mapping (ensure consistency with backend)
label_map = {0: "Incomplete Answer", 1: "Syntax Error", 2: "correct"}

# Define helper functions (same as in backend)
def can_parse_code(code_str):
    try:
        import ast
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

def has_non_empty_return(code_str):
    try:
        import ast
        tree = ast.parse(code_str)
        for node in ast.walk(tree):
            if isinstance(node, ast.Return):
                if node.value is not None:
                    return 1
        return 0
    except SyntaxError:
        return 0

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
    return df_out

@app.route('/classify', methods=['POST'])
def classify():
    try:
        data = request.get_json()
        logger.debug(f"Received data: {data}")
        
        instruction = data.get('instruction', '')
        input_text = data.get('input_text', '')
        user_answer = data.get('user_answer', '')
        
        logger.debug(f"Instruction: {instruction}")
        logger.debug(f"Input Text: {input_text}")
        logger.debug(f"User Answer: {user_answer}")

        # Create DataFrame
        single_df = pd.DataFrame([{
            'Instruction': instruction,
            'Input': input_text,
            'user_answer': user_answer
        }])
        logger.debug(f"DataFrame before feature computation:\n{single_df}")

        # Compute extra features
        single_df = compute_extra_features(single_df)
        logger.debug(f"DataFrame after feature computation:\n{single_df}")

        # Create merged_text
        single_df['merged_text'] = (
            single_df['Instruction'].fillna('') + " " +
            single_df['Input'].fillna('') + " " +
            single_df['user_answer'].fillna('')
        )
        logger.debug(f"DataFrame after creating merged_text:\n{single_df}")

        # Predict
        pred = model.predict(single_df)
        logger.debug(f"Model prediction: {pred}")
        
        pred_label = label_map.get(pred[0], "Unknown")
        logger.debug(f"Predicted label: {pred_label}")

        return jsonify({'label': pred_label})
    
    except Exception as e:
        logger.exception("Error during classification")
        return jsonify({'error': 'Internal server error.'}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5001, debug=True)

