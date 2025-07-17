from django.urls import path
from . import views

urlpatterns = [
    path('register-face/', views.register_face, name='register_face'),
    path('verify-face/', views.verify_face, name='verify_face'),
    path('scan-license-plate/', views.scan_license_plate, name='scan_license_plate'),
    path('face-attendance-logs/', views.face_attendance_logs, name='face_attendance_logs'),
    path('license-plate-logs/', views.license_plate_logs, name='license_plate_logs'),
]