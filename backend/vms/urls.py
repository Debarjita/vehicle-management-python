# backend/vms/urls.py - REPLACE YOUR CURRENT FILE WITH THIS
from django.contrib import admin
from django.urls import path, include
from rest_framework_simplejwt.views import TokenRefreshView
from accounts.views import CustomTokenObtainPairView

urlpatterns = [
    path('admin/', admin.site.urls),
    
    # Authentication endpoints
    path('api/token/', CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    
    # Accounts app
    path('api/accounts/', include('accounts.urls')), 
    
    # All other API endpoints (vehicles, orgs, users, etc.)
    path('api/', include('vehicles.urls')),  # This makes /api/orgs/, /api/users/ work
]