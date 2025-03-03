#this is a test change 
from django.urls import path, include
from .views import auth_views
from .views import org_views

urlpatterns = [
    path('login/', auth_views.login, name='login'),
]

urlpatterns = [
    path('organizations/', org_views.create_org, name='create_org'),
    path('organizations/', org_views.get_all_orgs, name='get_all_orgs'),
    path('organizations/<int:org_id>/', org_views.update_org, name='update_org'),
]

from .views import vehicle_views

urlpatterns += [
    path('vehicles/decode/<str:vin>/', vehicle_views.decode_vin, name='decode_vin'),
    path('vehicles/', vehicle_views.add_vehicle, name='add_vehicle'),
]

urlpatterns = [
    path('orgs/', include('api.views.org_urls')),  # Organization routes
    path('vehicles/', include('api.views.vehicle_urls')),  # Vehicle routes
]