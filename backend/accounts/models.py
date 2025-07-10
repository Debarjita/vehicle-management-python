from django.contrib.auth.models import AbstractUser
from django.db import models
from vehicles.models import Organization

class User(AbstractUser):
    class Role(models.TextChoices):
        ADMIN = 'ADMIN', 'Admin'
        GUARD = 'GUARD', 'Guard'
        DRIVER = 'DRIVER', 'Driver'
        ORG_MANAGER = 'ORG_MANAGER', 'Org Manager'

    role = models.CharField(
        max_length=20,
        choices=Role.choices,
        default=Role.ADMIN  # Keep ADMIN as default for superusers
    )
    org = models.ForeignKey(Organization, on_delete=models.SET_NULL, null=True, blank=True)
    
    # Add these fields for face recognition
    face_encoding = models.TextField(blank=True)  # Store face encoding for recognition
    is_face_registered = models.BooleanField(default=False)

    def __str__(self):
        return f"{self.username} ({self.role})"

    @property
    def can_create_users(self):
        """Check if user can create other users"""
        return self.role in ['ADMIN', 'ORG_MANAGER']

    @property
    def can_manage_vehicles(self):
        """Check if user can manage vehicles"""
        return self.role in ['ADMIN', 'ORG_MANAGER']

    @property
    def can_verify_attendance(self):
        """Check if user can verify others' attendance"""
        return self.role == 'GUARD'