# theoryAnswerModel.py
import joblib
import os
import json
import sys
from sklearn.preprocessing import LabelEncoder
import numpy as np

MODEL_DIR = os.path.dirname(os.path.abspath(__file__))

try:
    theory_model = joblib.load(
        os.path.join(MODEL_DIR, "logical_answer_classifier.pkl"))
    theory_vectorizer = joblib.load(
        os.path.join(MODEL_DIR, "theory_tfidf_vectorizer.pkl"))
except FileNotFoundError:
    print(json.dumps([
        {
            "error_type": "Model Not Loaded",
            "explanation": "Answer evaluation model could not be loaded."
        }
    ]))
    sys.exit(1)

# If you saved the label encoder, load it. Otherwise define it manually if you know the class order.
try:
    label_encoder = joblib.load(os.path.join(MODEL_DIR, "answer_label_encoder.pkl"))
except FileNotFoundError:
    label_encoder = LabelEncoder()
    label_encoder.classes_ = np.array(['correct','incorrect'])

def evaluate_answer(answer_text, min_length=5):
    if len(answer_text.strip()) < min_length:
        return [{
            "answer_type": "Invalid",
            "explanation": "The provided answer text is too short."
        }]

    try:
        # The variables below are consistent with what's loaded above
        vectorized_input = theory_vectorizer.transform([answer_text])
        prediction = theory_model.predict(vectorized_input)

        predicted_label = label_encoder.inverse_transform(prediction)[0]
        return [{
            "answer_type": predicted_label,
            "explanation": f"The model classified this answer as {predicted_label}."
        }]
    except Exception as e:
        return [{
            "error_type": "Model Error",
            "explanation": f"An error occurred during prediction: {str(e)}"
        }]

if __name__ == "__main__":
    try:
        user_answer = sys.argv[1] if len(sys.argv) > 1 else ""
        output = evaluate_answer(user_answer)
        print(json.dumps(output, indent=4))
    except Exception as e:
        print(json.dumps([{
            "error_type": "Execution Error",
            "explanation": str(e)
        }]))
