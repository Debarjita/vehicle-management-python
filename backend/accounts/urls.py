from django.urls import path
from .views import update_password

urlpatterns = [
    path('update-password/', update_password, name='update-password'),
]
