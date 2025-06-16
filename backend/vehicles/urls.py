# backend/vehicles/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import VehicleViewSet, vin_decode, upload_image,decode_vin
from .views import get_all_organizations, create_organization, update_organization,available_vehicles,claim_vehicles
from .views import log_vehicle_entry
from accounts.views import create_user_with_role,list_users, update_user


router = DefaultRouter()
router.register(r'vehicles', VehicleViewSet)

urlpatterns = [
    path('', include(router.urls)),
    path('vin-decode/', vin_decode),
    path('decode-vin/<str:vin>/', decode_vin),  
    path('upload-image/', upload_image),
    path('orgs-list/', get_all_organizations),
    path('orgs/', create_organization),
    path('orgs/<int:pk>/', update_organization),
    path('log-entry/', log_vehicle_entry),
    path('create-user/', create_user_with_role),
    path('users/', list_users),
    path('users/<int:user_id>/', update_user),
    path('available/', available_vehicles, name='available-vehicles'),
    path('claim/', claim_vehicles, name='claim-vehicles'),
]
