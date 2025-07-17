# backend/ai_features/models.py
from django.db import models
from django.contrib.auth import get_user_model
from vehicles.models import Vehicle

User = get_user_model()

class FaceEncoding(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='face_data')
    encoding_data = models.TextField(help_text="JSON array of face encoding vectors")
    photo_url = models.URLField(blank=True, help_text="URL to the original registration photo")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return f"Face data for {self.user.username}"

class FaceAttendanceLog(models.Model):
    SCAN_TYPE_CHOICES = [
        ('CHECK_IN', 'Check In'),
        ('CHECK_OUT', 'Check Out'),
        ('VERIFICATION', 'Verification'),
    ]
    
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    scan_type = models.CharField(max_length=20, choices=SCAN_TYPE_CHOICES)
    confidence_score = models.FloatField(help_text="Face recognition confidence (0-100)")
    scanned_image = models.TextField(help_text="Base64 encoded scanned image")
    timestamp = models.DateTimeField(auto_now_add=True)
    location = models.CharField(max_length=100, blank=True)
    verified_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='verifications_done')
    notes = models.TextField(blank=True)
    
    class Meta:
        ordering = ['-timestamp']

    def __str__(self):
        return f"{self.user.username} - {self.scan_type} - {self.timestamp.strftime('%Y-%m-%d %H:%M')}"

class LicensePlateRecord(models.Model):
    vehicle = models.ForeignKey(Vehicle, on_delete=models.CASCADE, related_name='plate_records')
    detected_plate = models.CharField(max_length=20, help_text="OCR detected license plate")
    confidence_score = models.FloatField(help_text="OCR confidence (0-100)")
    original_image = models.TextField(help_text="Base64 encoded original image")
    processed_image = models.TextField(blank=True, help_text="Base64 encoded processed image")
    timestamp = models.DateTimeField(auto_now_add=True)
    scanned_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    location = models.CharField(max_length=100, blank=True)
    entry_type = models.CharField(max_length=10, choices=[('ENTRY', 'Entry'), ('EXIT', 'Exit')])
    verified = models.BooleanField(default=False)
    
    class Meta:
        ordering = ['-timestamp']

    def __str__(self):
        return f"{self.detected_plate} - {self.entry_type} - {self.timestamp.strftime('%Y-%m-%d %H:%M')}"