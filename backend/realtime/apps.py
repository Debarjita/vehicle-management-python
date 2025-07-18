# backend/realtime/apps.py
from django.apps import AppConfig

class RealtimeConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'realtime'
    
    def ready(self):
        import realtime.signals