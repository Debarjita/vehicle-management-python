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
    STATUS_CHOICES = [
        ('AVAILABLE', 'Available'),
        ('ASSIGNED', 'Assigned'),
        ('IN_USE', 'In Use'),
        ('MAINTENANCE', 'Maintenance')
    ]
    
    vin = models.CharField(max_length=100, unique=True)
    license_plate = models.CharField(max_length=20, blank=True)
    make = models.CharField(max_length=100, blank=True)
    model = models.CharField(max_length=100, blank=True)
    year = models.IntegerField(null=True, blank=True)
    mileage = models.IntegerField(null=True, blank=True)
    org = models.ForeignKey(Organization, on_delete=models.SET_NULL, null=True, blank=True)  # Changed from CharField
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='AVAILABLE')
    assigned_driver = models.ForeignKey('accounts.User', on_delete=models.SET_NULL, null=True, blank=True, related_name='assigned_vehicles')

    def __str__(self):
        return f"{self.license_plate or self.vin}"

class Shift(models.Model):
    SHIFT_TYPE_CHOICES = [
        ('GUARD', 'Guard Shift'),
        ('DRIVER', 'Driver Shift')
    ]
    
    user = models.ForeignKey('accounts.User', on_delete=models.CASCADE)
    shift_type = models.CharField(max_length=10, choices=SHIFT_TYPE_CHOICES)
    date = models.DateField()
    start_time = models.TimeField()
    end_time = models.TimeField()
    vehicle = models.ForeignKey(Vehicle, on_delete=models.CASCADE, null=True, blank=True)  # For driver shifts
    org = models.ForeignKey(Organization, on_delete=models.CASCADE)
    is_active = models.BooleanField(default=True)

    class Meta:
        unique_together = ['user', 'date', 'shift_type']

    def __str__(self):
        return f"{self.user.username} - {self.shift_type} - {self.date}"

class AttendanceLog(models.Model):
    ACTION_CHOICES = [
        ('LOGIN', 'Login'),
        ('LOGOUT', 'Logout')
    ]
    
    user = models.ForeignKey('accounts.User', on_delete=models.CASCADE)
    action = models.CharField(max_length=10, choices=ACTION_CHOICES)
    timestamp = models.DateTimeField(auto_now_add=True)
    shift = models.ForeignKey(Shift, on_delete=models.CASCADE, null=True, blank=True)
    face_image = models.TextField(blank=True)  # Base64 encoded image
    verified_by = models.ForeignKey('accounts.User', on_delete=models.SET_NULL, null=True, blank=True, related_name='verified_attendance')

    def __str__(self):
        return f"{self.user.username} - {self.action} - {self.timestamp}"

class VehicleVerification(models.Model):
    vehicle = models.ForeignKey(Vehicle, on_delete=models.CASCADE)
    driver = models.ForeignKey('accounts.User', on_delete=models.CASCADE, related_name='vehicle_verifications')
    guard = models.ForeignKey('accounts.User', on_delete=models.CASCADE, related_name='guard_verifications')
    license_plate_image = models.TextField()  # Base64 encoded
    driver_face_image = models.TextField()    # Base64 encoded
    verification_time = models.DateTimeField(auto_now_add=True)
    is_verified = models.BooleanField(default=True)
    shift = models.ForeignKey(Shift, on_delete=models.CASCADE)

    def __str__(self):
        return f"{self.vehicle} verified by {self.guard.username}"

class EntryLog(models.Model):
    ACTION_CHOICES = [
        ('ENTRY', 'Entry'),
        ('EXIT', 'Exit')
    ]

    vehicle = models.ForeignKey(Vehicle, on_delete=models.CASCADE)
    action = models.CharField(choices=ACTION_CHOICES, max_length=10)
    timestamp = models.DateTimeField(auto_now_add=True)
    created_by = models.ForeignKey('accounts.User', on_delete=models.SET_NULL, null=True)

    def __str__(self):
        return f"{self.vehicle.vin} - {self.action} @ {self.timestamp}"