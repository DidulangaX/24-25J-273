# models/theoryAnswerChecker.py
import joblib, sys, json, os

# Load once at import
MODEL_PATH = os.path.join(os.path.dirname(__file__), "theory_answer_checker.pkl")
pipe = joblib.load(MODEL_PATH)

def evaluate(question, answer):
    text = f"{question} [SEP] {answer}"
    pred = pipe.predict([text])[0]
    label = "correct" if pred == 1 else "incorrect"
    return [{
        "answer_type": label,
        "explanation": f"Model thinks this is {label}."
    }]

if __name__ == "__main__":
    # Expect exactly two CLI args: question and answer
    if len(sys.argv) < 3:
        print(json.dumps([{
            "error_type": "InvalidInvocation",
            "explanation": "Usage: python theoryAnswerChecker.py <question> <answer>"
        }]))
        sys.exit(1)
    q, a = sys.argv[1], sys.argv[2]
    out = evaluate(q, a)
    print(json.dumps(out))
