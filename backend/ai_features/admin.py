from django.contrib import admin
from .models import FaceEncoding, FaceAttendanceLog, LicensePlateRecord

@admin.register(FaceEncoding)
class FaceEncodingAdmin(admin.ModelAdmin):
    list_display = ['user', 'is_active', 'created_at', 'updated_at']
    list_filter = ['is_active', 'created_at']
    search_fields = ['user__username', 'user__first_name', 'user__last_name']
    readonly_fields = ['created_at', 'updated_at']

@admin.register(FaceAttendanceLog)
class FaceAttendanceLogAdmin(admin.ModelAdmin):
    list_display = ['user', 'scan_type', 'confidence_score', 'timestamp', 'verified_by']
    list_filter = ['scan_type', 'timestamp', 'user__role']
    search_fields = ['user__username', 'verified_by__username']
    readonly_fields = ['timestamp']
    ordering = ['-timestamp']

@admin.register(LicensePlateRecord)
class LicensePlateRecordAdmin(admin.ModelAdmin):
    list_display = ['detected_plate', 'vehicle', 'entry_type', 'confidence_score', 'verified', 'timestamp']
    list_filter = ['entry_type', 'verified', 'timestamp']
    search_fields = ['detected_plate', 'vehicle__license_plate', 'vehicle__make', 'vehicle__model']
    readonly_fields = ['timestamp']
    ordering = ['-timestamp']