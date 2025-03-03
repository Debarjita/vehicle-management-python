from django.urls import path
from api.views import org_views  # Import views from api.views, NOT from views folder

urlpatterns = [
    path('', org_views.get_all_orgs, name='get_all_orgs'),  # GET all organizations
    path('create/', org_views.create_org, name='create_org'),  # POST to create organization
    path('<int:org_id>/', org_views.update_org, name='update_org'),  # Update organization
]
