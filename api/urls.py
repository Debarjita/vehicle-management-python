#this is a test change 
from django.urls import path
from .views import auth_views

urlpatterns = [
    path('login/', auth_views.login, name='login'),
]