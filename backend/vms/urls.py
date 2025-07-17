# backend/vms/urls.py 
from django.contrib import admin
from django.urls import path, include
from rest_framework_simplejwt.views import TokenRefreshView
from accounts.views import CustomTokenObtainPairView
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('admin/', admin.site.urls),
    
    # Authentication endpoints
    path('api/token/', CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    
    # Accounts app
    path('api/accounts/', include('accounts.urls')), 
    
    # All other API endpoints (vehicles, orgs, users, etc.)
    path('api/', include('vehicles.urls')),  # This makes /api/orgs/, /api/users/ work
    
    path('api/ai/', include('ai_features.urls')),

]

# Serve media files during development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)