from django.urls import path
from api.views import vehicle_views  # Import views correctly

urlpatterns = [
    path('decode/<str:vin>/', vehicle_views.decode_vin, name='decode_vin'),  # Decode VIN
    path('', vehicle_views.add_vehicle, name='add_vehicle'),  # Add vehicle
    path('<str:vin>/', vehicle_views.get_vehicle, name='get_vehicle'),  # Get vehicle
]
