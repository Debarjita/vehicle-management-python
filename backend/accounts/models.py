
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
        default=Role.DRIVER  # or ADMIN if you want the first user to have all access
    )
    org = models.ForeignKey(Organization, on_delete=models.SET_NULL, null=True, blank=True)

    def __str__(self):
        return f"{self.username} ({self.role})"
