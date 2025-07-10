# backend/realtime/routing.py
from django.urls import re_path
from . import consumers

websocket_urlpatterns = [
    re_path(r'ws/vehicle-logs/$', consumers.VehicleLogConsumer.as_asgi()),
]