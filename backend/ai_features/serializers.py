# backend/ai_features/serializers.py
from rest_framework import serializers
from .models import FaceEncoding, FaceAttendanceLog, LicensePlateRecord

class FaceEncodingSerializer(serializers.ModelSerializer):
    user_username = serializers.CharField(source='user.username', read_only=True)
    
    class Meta:
        model = FaceEncoding
        fields = ['id', 'user', 'user_username', 'is_active', 'created_at', 'updated_at']
        read_only_fields = ['created_at', 'updated_at']

class FaceAttendanceLogSerializer(serializers.ModelSerializer):
    user_username = serializers.CharField(source='user.username', read_only=True)
    verified_by_username = serializers.CharField(source='verified_by.username', read_only=True)
    
    class Meta:
        model = FaceAttendanceLog
        fields = [
            'id', 'user', 'user_username', 'scan_type', 'confidence_score',
            'timestamp', 'location', 'verified_by', 'verified_by_username', 'notes'
        ]
        read_only_fields = ['timestamp']

class LicensePlateRecordSerializer(serializers.ModelSerializer):
    scanned_by_username = serializers.CharField(source='scanned_by.username', read_only=True)
    vehicle_info = serializers.SerializerMethodField()
    
    class Meta:
        model = LicensePlateRecord
        fields = [
            'id', 'vehicle', 'vehicle_info', 'detected_plate', 'confidence_score',
            'entry_type', 'verified', 'timestamp', 'location', 'scanned_by', 'scanned_by_username'
        ]
        read_only_fields = ['timestamp']
    
    def get_vehicle_info(self, obj):
        if obj.vehicle:
            return {
                'id': obj.vehicle.id,
                'license_plate': obj.vehicle.license_plate,
                'make': obj.vehicle.make,
                'model': obj.vehicle.model,
                'year': obj.vehicle.year
            }
        return None