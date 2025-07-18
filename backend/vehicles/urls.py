# backend/vehicles/urls.py - ADD THESE MISSING ENDPOINTS
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import VehicleViewSet, vin_decode, upload_image, decode_vin
from .views import get_all_organizations, create_organization, update_organization, available_vehicles, claim_vehicles
from .views import log_vehicle_entry, add_vehicle
from accounts.views import create_user_with_role, list_users, update_user
from .views import (
    create_guard_or_driver, assign_driver_to_vehicle, generate_schedules,
    org_dashboard, record_attendance, verify_driver_vehicle, guard_dashboard,
    driver_dashboard, my_org_users, my_org_vehicles, debug_org_manager  # Add debug_org_manager
)

router = DefaultRouter()
router.register(r'vehicles', VehicleViewSet)

urlpatterns = [
    path('', include(router.urls)),
    
    # Vehicle management
    path('add-vehicle/', add_vehicle, name='add-vehicle'),
    path('vin-decode/', vin_decode, name='vin-decode'),
    path('decode-vin/<str:vin>/', decode_vin, name='decode-vin'),  
    path('upload-image/', upload_image, name='upload-image'),
    
    # Organization management
    path('orgs-list/', get_all_organizations, name='orgs-list'),
    path('orgs/', create_organization, name='create-organization'),
    path('orgs/<int:pk>/', update_organization, name='update-organization'),
    
    # Logging
    path('log-entry/', log_vehicle_entry, name='log-entry'),
    
    # User management - THESE ARE THE MISSING ENDPOINTS
    path('create-guard-driver/', create_guard_or_driver, name='create-guard-driver'),  # MISSING!
    path('create-user/', create_user_with_role, name='create-user'),
    path('users/', list_users, name='list-users'),
    path('users/<int:user_id>/', update_user, name='update-user'),
    
    # Vehicle pool
    path('available/', available_vehicles, name='available-vehicles'),
    path('claim/', claim_vehicles, name='claim-vehicles'),

    # Org Manager URLs - THESE ENDPOINTS NEED TO WORK
    path('assign-driver/', assign_driver_to_vehicle, name='assign-driver'),  # FIXED NAME
    path('generate-schedules/', generate_schedules, name='generate-schedules'),
    path('org-dashboard/', org_dashboard, name='org-dashboard'),
    path('generate-schedules/', generate_schedules, name='generate-schedules'),
    
    # Guard URLs  
    path('record-attendance/', record_attendance, name='record-attendance'),
    path('verify-driver-vehicle/', verify_driver_vehicle, name='verify-driver-vehicle'),
    path('guard-dashboard/', guard_dashboard, name='guard-dashboard'),
    
    # Driver URLs
    path('driver-dashboard/', driver_dashboard, name='driver-dashboard'),
    
    # Shared URLs - THESE ARE CRITICAL FOR ORG MANAGER
    path('my-org-users/', my_org_users, name='my-org-users'),
    path('my-org-vehicles/', my_org_vehicles, name='my-org-vehicles'),
    
    # Debug endpoint
    path('debug-org/', debug_org_manager, name='debug-org-manager'),
]