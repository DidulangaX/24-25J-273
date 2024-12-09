from django.shortcuts import render

# Create your views here.
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
import joblib
import pandas as pd
import json

# Load the trained model
print("Loading trained model...")
model_path = 'C:/ResearchProject/models/random_forest_model.pkl'
model = joblib.load(model_path)
print("Model loaded successfully!")

@csrf_exempt
def predict_difficulty(request):
    if request.method == 'POST':
        try:
            # Parse JSON data from request
            data = json.loads(request.body)
            
            # Convert to DataFrame
            features = pd.DataFrame([data])
            
            # Align features with model requirements
            required_features = model.feature_names_in_
            features = features.reindex(columns=required_features, fill_value=0)
            
            # Make prediction
            prediction = model.predict(features)[0]
            
            # Return the result
            return JsonResponse({'difficulty': int(prediction)})
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=400)
    else:
        return JsonResponse({'error': 'Invalid request method.'}, status=405)
