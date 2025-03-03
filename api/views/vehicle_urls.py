# api/views/vehicle_urls.py
from django.urls import path
from . import vehicle_views

urlpatterns = [
    # Route for decoding VIN
    path('decode/vin/<str:vin>/', vehicle_views.decode_vin, name='decode_vin'),
    
    # Route for adding a new vehicle
    path('', vehicle_views.add_vehicle, name='add_vehicle'),
    
    # Route for getting a vehicle
    path('<str:vin>/', vehicle_views.get_vehicle, name='get_vehicle'),
]