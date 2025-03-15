# inspect_pipeline.py
import dill

with open("my_final_model.pkl", "rb") as f:
    model = dill.load(f)

print("Pipeline steps or model structure:")
print(model)
