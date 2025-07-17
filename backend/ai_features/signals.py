# backend/ai_features/signals.py
from django.db.signals import post_save
from django.dispatch import receiver
from django.contrib.auth import get_user_model
from .models import FaceEncoding

User = get_user_model()

@receiver(post_save, sender=User)
def create_face_encoding_placeholder(sender, instance, created, **kwargs):
    """Create a placeholder for face encoding when user is created"""
    if created and instance.role in ['GUARD', 'DRIVER']:
        # Don't create actual encoding, just mark as not registered
        instance.is_face_registered = False
        instance.save(update_fields=['is_face_registered'])