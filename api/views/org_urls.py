# api/views/org_urls.py
from django.urls import path
from . import org_views

urlpatterns = [
    path('', org_views.get_all_orgs, name='get_all_orgs'),  # GET /orgs with pagination
    path('create/', org_views.create_org, name='create_org'),  # POST /create/
]