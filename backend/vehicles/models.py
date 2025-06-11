# backend/vehicles/models.py
from django.db import models
from django.contrib.auth.models import User

class Organization(models.Model):
    name = models.CharField(max_length=100, unique=True)
    account = models.CharField(max_length=100)
    website = models.CharField(max_length=100)
    fuelReimbursementPolicy = models.CharField(max_length=100, default='1000')
    speedLimitPolicy = models.CharField(max_length=100, blank=True)
    parent = models.ForeignKey('self', null=True, blank=True, on_delete=models.SET_NULL, related_name='children')

    def __str__(self):
        return self.name

class Vehicle(models.Model):
    vin = models.CharField(max_length=100, unique=True)
    license_plate = models.CharField(max_length=20, blank=True)
    make = models.CharField(max_length=100, blank=True)
    model = models.CharField(max_length=100, blank=True)
    year = models.IntegerField(null=True, blank=True)
    mileage = models.IntegerField(null=True, blank=True)
    org = models.CharField(max_length=100)

    def __str__(self):
        return f"{self.license_plate or self.vin}"
