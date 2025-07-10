# backend/realtime/signals.py
from django.db.models.signals import post_save
from django.dispatch import receiver
from vehicles.models import EntryLog
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
import json

@receiver(post_save, sender=EntryLog)
def broadcast_vehicle_log(sender, instance, created, **kwargs):
    if created:  # Only for new logs
        channel_layer = get_channel_layer()
        
        # Broadcast to organization-specific group
        if instance.vehicle.org:
            group_name = f"vehicle_logs_{instance.vehicle.org.id}"
        else:
            group_name = "vehicle_logs_global"
        
        # Also broadcast to global admin group
        groups = [group_name, "vehicle_logs_global"]
        
        log_data = {
            'type': 'vehicle_log_message',
            'message_type': 'new_log',
            'log': {
                'id': instance.id,
                'vehicle_plate': instance.vehicle.license_plate or instance.vehicle.vin,
                'vehicle_make_model': f"{instance.vehicle.make} {instance.vehicle.model}",
                'action': instance.action,
                'timestamp': instance.timestamp.isoformat(),
                'created_by': instance.created_by.username if instance.created_by else 'System',
                'organization': instance.vehicle.org.name if instance.vehicle.org else 'Unassigned'
            }
        }
        
        for group in groups:
            async_to_sync(channel_layer.group_send)(group, log_data)