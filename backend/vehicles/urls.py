# backend/vehicles/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import VehicleViewSet, vin_decode, upload_image

router = DefaultRouter()
router.register(r'vehicles', VehicleViewSet)

urlpatterns = [
    path('', include(router.urls)),
    path('vin-decode/', vin_decode),
    path('upload-image/', upload_image),
]
