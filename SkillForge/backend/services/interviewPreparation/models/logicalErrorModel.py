import joblib
import os
import json
import sys

MODEL_DIR = os.path.dirname(os.path.abspath(__file__))

try:
    classifier = joblib.load(os.path.join(MODEL_DIR, "logical_error_classifier.pkl"))
    vectorizer = joblib.load(os.path.join(MODEL_DIR, "tfidf_vectorizer.pkl"))
except FileNotFoundError:
    print(json.dumps([{"error_type": "Model Not Loaded", "explanation": "AI model could not be loaded."}]))
    sys.exit(1)

error_types = [
    "Incorrect Comparison", "Incorrect Logic", "Infinite Loop", "Logic in Loop Conditions",
    "Misplaced Operators", "Missing Base Case in Recursion", "Missing Initialization",
    "Missing Null Check", "Wrong Return Values"
]

def predict_errors(code_snippet, threshold=0.4):  # 🔹 Increased threshold to 0.4
    if len(code_snippet.strip()) < 10:  # 🔹 Ignore short inputs
        return [{"error_type": "No Errors Detected", "explanation": "Code is too short to analyze."}]

    try:
        transformed_input = vectorizer.transform([code_snippet])
        predicted_probabilities = classifier.predict_proba(transformed_input)[0]

        detected_errors = []
        for i, prob in enumerate(predicted_probabilities):
            if prob >= threshold:  # 🔹 Ignore weak predictions
                detected_errors.append({
                    "error_type": error_types[i],
                    "explanation": f"The model detected a logical error: {error_types[i]}"
                })

        if not detected_errors:
            detected_errors.append({"error_type": "No Errors Detected", "explanation": "No logical errors found."})

        return detected_errors
    except Exception as e:
        return [{"error_type": "Model Error", "explanation": f"An error occurred: {str(e)}"}]

# Command-line execution
if __name__ == "__main__":
    try:
        code_snippet = sys.argv[1] if len(sys.argv) > 1 else ""
        output = predict_errors(code_snippet)
        print(json.dumps(output, indent=4))  # ✅ Ensures proper JSON output
    except Exception as e:
        print(json.dumps([{"error_type": "Execution Error", "explanation": str(e)}]))
