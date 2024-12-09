from django.urls import path
from .views import predict_difficulty

urlpatterns = [
    path('predict/', predict_difficulty, name='predict_difficulty'),
]
