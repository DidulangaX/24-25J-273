# inference.py
from fastapi import FastAPI, HTTPException
from fastapi import FastAPI
from pydantic import BaseModel
from transformers import pipeline, AutoTokenizer, AutoModelForSequenceClassification
import os

class PredictRequest(BaseModel):
    text: str

class PredictResponse(BaseModel):
    label: str
    score: float

app = FastAPI()

@app.on_event("startup")
def load_model():
    # Base folder is the location of inference.py
    base_dir = os.path.dirname(__file__)

    # Correct path into the ml subfolder
    model_dir = os.path.join(base_dir, "ml", "urgency_model")

    # Ensure the folder exists
    if not os.path.isdir(model_dir):
        raise FileNotFoundError(f"Model folder not found: {model_dir}")

    # Temporarily cd into the model directory so from_pretrained(".") works
    cwd = os.getcwd()
    os.chdir(model_dir)

    # Load tokenizer & model from "."
    tokenizer = AutoTokenizer.from_pretrained(".", local_files_only=True)
    model     = AutoModelForSequenceClassification.from_pretrained(
                    ".", local_files_only=True, num_labels=3
                )

    # Return to original working dir
    os.chdir(cwd)

    # Build the pipeline
    app.state.classifier = pipeline(
    "text-classification", model=model, tokenizer=tokenizer
    )

    print("✅ Urgency classifier loaded")


@app.post("/predict", response_model=PredictResponse)
def predict(req: PredictRequest):
    try:
        out = app.state.classifier(req.text)[0]
        idx = int(out["label"].split("_")[1])
        label = ["Low", "Medium", "High"][idx]
        return PredictResponse(label=label, score=out["score"])
    except Exception as e:
        import traceback; traceback.print_exc()
        # wrap and re-raise so FastAPI returns a 500
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("inference:app", host="0.0.0.0", port=5005)

