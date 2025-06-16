# backend/vehicles/views.py
from rest_framework import viewsets, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from accounts.models import User              
from accounts.permissions import IsDriver   
from django.shortcuts import get_object_or_404
from .models import Vehicle, Organization,EntryLog
from .serializers import VehicleSerializer, RecursiveOrgSerializer,EntryLogSerializer
from django.core.cache import cache
from accounts.permissions import IsAdmin, IsGuard, IsOrgManager
from rest_framework.decorators import permission_classes
from accounts.permissions import IsAdminOrOrgManager
from .models import Shift, AttendanceLog, VehicleVerification
from datetime import datetime, timedelta, time
import random


import pytesseract
pytesseract.pytesseract.tesseract_cmd = r'C:\Program Files\Tesseract-OCR\tesseract.exe'

import pytesseract
import cv2
import numpy as np
import base64
from PIL import Image
import io
import re
import requests
import time

vin_call_timestamps = []

# ViewSets
class VehicleViewSet(viewsets.ModelViewSet):
    queryset = Vehicle.objects.all()
    serializer_class = VehicleSerializer

# Image Upload + OCR
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def upload_image(request):
    image_data = request.data.get('image_base64', '')
    if not image_data:
        return Response({"error": "No image provided."}, status=400)
    try:
        image_bytes = base64.b64decode(image_data.split(',')[-1])
        image = Image.open(io.BytesIO(image_bytes)).convert('RGB')
        image_np = np.array(image)
        gray = cv2.cvtColor(image_np, cv2.COLOR_RGB2GRAY)
        text = pytesseract.image_to_string(gray)
        return Response({"recognized_text": text.strip()})
    except Exception as e:
        import traceback
        print("OCR Exception:", e)
        traceback.print_exc()  # 👈 This will show the exact error + line number
        return Response({"error": str(e)}, status=500)

# VIN Decoding from Request
@api_view(['POST'])
@permission_classes([IsAdminOrOrgManager])
def vin_decode(request):
    vin = request.data.get('vin', '')
    return decode_vin(request, vin)

# NHTSA VIN Decode with caching + rate limit
@api_view(['GET'])
@permission_classes([IsAdminOrOrgManager])
def decode_vin(request, vin):
    vin = vin.strip().upper()
    if not re.fullmatch(r'^[A-HJ-NPR-Z0-9]{17}$', vin):
        return Response({"error": "Invalid VIN format"}, status=400)

    cached = cache.get(vin)
    if cached:
        return Response(cached)

    now = time.time()
    vin_call_timestamps.append(now)
    vin_call_timestamps[:] = [t for t in vin_call_timestamps if now - t < 60]
    if len(vin_call_timestamps) > 5:
        return Response({"error": "Rate limit exceeded. Try again later."}, status=429)

    try:
        url = f"https://vpic.nhtsa.dot.gov/api/vehicles/decodevinvalues/{vin}?format=json"
        res = requests.get(url)
        data = res.json()
        result = data['Results'][0]
        decoded = {
            "vin": vin,
            "make": result.get("Make"),
            "model": result.get("Model"),
            "year": result.get("ModelYear"),
            "manufacturer": result.get("Manufacturer"),
            "horsepower": result.get("EngineHP")
        }
        cache.set(vin, decoded, timeout=3600)
        vin_call_timestamps.append(now)
        return Response(decoded)
    except Exception as e:
        return Response({"error": str(e)}, status=500)
    



# POST /api/vehicles
@api_view(['POST'])
@permission_classes([IsAdmin])
def add_vehicle(request):
    vin = request.data.get('vin', '').strip().upper()
    org_name = request.data.get('org', '').strip()

    if not re.fullmatch(r'^[A-HJ-NPR-Z0-9]{17}$', vin):
        return Response({"error": "Invalid VIN format."}, status=400)

    try:
        org = Organization.objects.get(name=org_name)
    except Organization.DoesNotExist:
        return Response({"error": "Organization does not exist."}, status=400)

    if Vehicle.objects.filter(vin=vin).exists():
        return Response({"error": "Vehicle already exists."}, status=400)

    decoded = cache.get(vin)
    if not decoded:
        try:
            url = f"https://vpic.nhtsa.dot.gov/api/vehicles/decodevinvalues/{vin}?format=json"
            res = requests.get(url)
            data = res.json()
            result = data['Results'][0]
            decoded = {
                "vin": vin,
                "make": result.get("Make"),
                "model": result.get("Model"),
                "year": result.get("ModelYear"),
                "manufacturer": result.get("Manufacturer"),
                "horsepower": result.get("EngineHP")
            }
            cache.set(vin, decoded, timeout=3600)
        except Exception as e:
            return Response({"error": str(e)}, status=500)

    vehicle = Vehicle.objects.create(
        vin=vin,
        make=decoded.get('make'),
        model=decoded.get('model'),
        year=decoded.get('year'),
        org=org.name
    )
    serializer = VehicleSerializer(vehicle)
    return Response(serializer.data, status=201)

@api_view(['POST'])
@permission_classes([IsAdmin])
def create_organization(request):
    serializer = RecursiveOrgSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data, status=201)
    return Response(serializer.errors, status=400)


# GET /api/orgs-list/
@api_view(['GET'])
@permission_classes([IsAdminOrOrgManager])
def get_all_organizations(request):
    print("🔍 request.user:", request.user)
    print("✅ is_authenticated:", request.user.is_authenticated)
    print("🔑 role:", getattr(request.user, 'role', 'MISSING'))
    root_orgs = Organization.objects.filter(parent__isnull=True)
    serializer = RecursiveOrgSerializer(root_orgs, many=True)
    return Response(serializer.data)


@api_view(['PATCH'])
@permission_classes([IsAdmin])
def update_organization(request, pk):
    try:
        org = Organization.objects.get(pk=pk)
    except Organization.DoesNotExist:
        return Response({'error': 'Organization not found'}, status=404)

    # 🛡️ Validate Rule (c)
    if 'fuelReimbursementPolicy' in request.data and org.parent:
        inherited = org.parent.fuelReimbursementPolicy
        if inherited and org.fuelReimbursementPolicy == inherited:
            return Response(
                {'error': 'Cannot override inherited fuelReimbursementPolicy. Patch the parent.'},
                status=400
            )

    # Store original values
    old_fuel = org.fuelReimbursementPolicy
    old_speed = org.speedLimitPolicy

    serializer = RecursiveOrgSerializer(org, data=request.data, partial=True)
    if serializer.is_valid():
        updated = serializer.save()

        # 🌀 Rule (b)
        if 'fuelReimbursementPolicy' in request.data and updated.fuelReimbursementPolicy != old_fuel:
            propagate_fuel_policy(updated)

        # 🌀 Rule (g)
        if 'speedLimitPolicy' in request.data and updated.speedLimitPolicy != old_speed:
            propagate_speed_policy(updated)

        return Response(serializer.data)

    return Response(serializer.errors, status=400)

def propagate_fuel_policy(org):
    for child in org.children.all():
        child.fuelReimbursementPolicy = org.fuelReimbursementPolicy
        child.save()
        propagate_fuel_policy(child)

def propagate_speed_policy(org):
    for child in org.children.all():
        if not child.speedLimitPolicy:  # if not overridden
            child.speedLimitPolicy = org.speedLimitPolicy
            child.save()
            propagate_speed_policy(child)


@api_view(['POST'])
@permission_classes([IsGuard])
def log_vehicle_entry(request):
    vehicle_id = request.data.get('vehicle_id')
    action = request.data.get('action', '').upper()

    if action not in ['ENTRY', 'EXIT']:
        return Response({'error': 'Invalid action. Must be ENTRY or EXIT.'}, status=400)

    try:
        vehicle = Vehicle.objects.get(id=vehicle_id)
    except Vehicle.DoesNotExist:
        return Response({'error': 'Vehicle not found'}, status=404)

    log = EntryLog.objects.create(
        vehicle=vehicle,
        action=action,
        created_by=request.user
    )

    serializer = EntryLogSerializer(log)
    return Response(serializer.data, status=201)

@api_view(['GET'])
@permission_classes([IsAdminOrOrgManager])
def available_vehicles(request):
    vehicles = Vehicle.objects.filter(org__isnull=True)
    serializer = VehicleSerializer(vehicles, many=True)
    return Response(serializer.data)

@api_view(['POST'])
@permission_classes([IsAdminOrOrgManager])
def claim_vehicles(request):
    vehicle_ids = request.data.get('vehicle_ids', [])
    org = request.user.org  # adjust this if your User model links org differently

    updated = 0
    for vid in vehicle_ids:
        vehicle = get_object_or_404(Vehicle, id=vid, org__isnull=True)
        vehicle.org = org
        vehicle.save()
        updated += 1

    return Response({"claimed": updated}, status=200)

@api_view(['POST'])
@permission_classes([IsAuthenticated, IsOrgManager])
def create_guard_or_driver(request):
    """Org Manager creates guards/drivers"""
    username = request.data.get('username')
    password = request.data.get('password') 
    role = request.data.get('role')  # 'GUARD' or 'DRIVER'
    
    if role not in ['GUARD', 'DRIVER']:
        return Response({'error': 'Role must be GUARD or DRIVER'}, status=400)
    
    if not username or not password:
        return Response({'error': 'Username and password required'}, status=400)
        
    user = User.objects.create_user(
        username=username, 
        password=password, 
        role=role,
        org=request.user.org
    )
    return Response({'message': f'{role} created successfully'})

@api_view(['POST']) 
@permission_classes([IsAuthenticated, IsOrgManager])
def claim_vehicles(request):
    """Org Manager selects vehicles from available pool"""
    vehicle_ids = request.data.get('vehicle_ids', [])
    
    updated = 0
    for vid in vehicle_ids:
        vehicle = get_object_or_404(Vehicle, id=vid, org__isnull=True, status='AVAILABLE')
        vehicle.org = request.user.org
        vehicle.status = 'ASSIGNED'
        vehicle.save()
        updated += 1
    
    return Response({"claimed": updated})

@api_view(['POST'])
@permission_classes([IsAuthenticated, IsOrgManager]) 
def assign_driver_to_vehicle(request):
    """Assign driver to specific vehicle"""
    vehicle_id = request.data.get('vehicle_id')
    driver_id = request.data.get('driver_id')
    
    vehicle = get_object_or_404(Vehicle, id=vehicle_id, org=request.user.org)
    driver = get_object_or_404(User, id=driver_id, role='DRIVER', org=request.user.org)
    
    vehicle.assigned_driver = driver
    vehicle.save()
    
    return Response({'message': 'Driver assigned successfully'})

@api_view(['POST'])
@permission_classes([IsAuthenticated, IsOrgManager])
def generate_schedules(request):
    """AI generates schedules for guards and drivers"""
    date = request.data.get('date', datetime.now().date())
    
    # Get org's guards and drivers
    guards = User.objects.filter(org=request.user.org, role='GUARD')
    drivers = User.objects.filter(org=request.user.org, role='DRIVER')
    vehicles = Vehicle.objects.filter(org=request.user.org, status='ASSIGNED')
    
    # Simple AI scheduling logic
    guard_shifts = []
    driver_shifts = []
    
    # Create 3 guard shifts (8-hour shifts)
    shift_times = [
        (time(6, 0), time(14, 0)),   # Morning
        (time(14, 0), time(22, 0)),  # Afternoon  
        (time(22, 0), time(6, 0))    # Night
    ]
    
    # Assign guards to shifts
    for i, guard in enumerate(guards[:3]):  # Max 3 guards per day
        start_time, end_time = shift_times[i % 3]
        shift = Shift.objects.create(
            user=guard,
            shift_type='GUARD',
            date=date,
            start_time=start_time,
            end_time=end_time,
            org=request.user.org
        )
        guard_shifts.append(shift)
    
    # Assign drivers to vehicles
    for vehicle in vehicles:
        if vehicle.assigned_driver:
            shift = Shift.objects.create(
                user=vehicle.assigned_driver,
                shift_type='DRIVER', 
                date=date,
                start_time=time(8, 0),  # Standard 8-5 shift
                end_time=time(17, 0),
                vehicle=vehicle,
                org=request.user.org
            )
            driver_shifts.append(shift)
    
    return Response({
        'guard_shifts': len(guard_shifts),
        'driver_shifts': len(driver_shifts),
        'message': 'Schedules generated successfully'
    })

@api_view(['GET'])
@permission_classes([IsAuthenticated, IsOrgManager])
def org_dashboard(request):
    """Org Manager dashboard data"""
    org = request.user.org
    today = datetime.now().date()
    
    # Get today's attendance
    attendance_logs = AttendanceLog.objects.filter(
        user__org=org,
        timestamp__date=today
    ).order_by('-timestamp')
    
    # Get vehicle verifications
    verifications = VehicleVerification.objects.filter(
        vehicle__org=org,
        verification_time__date=today
    )
    
    return Response({
        'total_guards': User.objects.filter(org=org, role='GUARD').count(),
        'total_drivers': User.objects.filter(org=org, role='DRIVER').count(), 
        'total_vehicles': Vehicle.objects.filter(org=org).count(),
        'todays_attendance': len(attendance_logs),
        'todays_verifications': len(verifications),
        'recent_logs': [
            {
                'user': log.user.username,
                'action': log.action,
                'time': log.timestamp.strftime('%H:%M')
            } for log in attendance_logs[:10]
        ]
    })

# GUARD FUNCTIONS

@api_view(['POST'])
@permission_classes([IsAuthenticated, IsGuard])
def record_attendance(request):
    """Guard records login/logout with face scan"""
    action = request.data.get('action')  # 'LOGIN' or 'LOGOUT'
    face_image = request.data.get('face_image')  # Base64
    user_id = request.data.get('user_id', request.user.id)  # For recording driver attendance
    
    user = get_object_or_404(User, id=user_id, org=request.user.org)
    
    # Get today's shift
    today = datetime.now().date()
    shift = Shift.objects.filter(user=user, date=today).first()
    
    attendance = AttendanceLog.objects.create(
        user=user,
        action=action,
        shift=shift,
        face_image=face_image,
        verified_by=request.user if user != request.user else None
    )
    
    return Response({'message': f'{action} recorded successfully'})

@api_view(['POST'])
@permission_classes([IsAuthenticated, IsGuard])
def verify_driver_vehicle(request):
    """Guard verifies driver has correct vehicle"""
    driver_id = request.data.get('driver_id')
    vehicle_id = request.data.get('vehicle_id')
    license_plate_image = request.data.get('license_plate_image')
    driver_face_image = request.data.get('driver_face_image')
    
    driver = get_object_or_404(User, id=driver_id, role='DRIVER', org=request.user.org)
    vehicle = get_object_or_404(Vehicle, id=vehicle_id, org=request.user.org)
    
    # Get today's driver shift
    today = datetime.now().date()
    shift = Shift.objects.filter(user=driver, date=today, shift_type='DRIVER').first()
    
    verification = VehicleVerification.objects.create(
        vehicle=vehicle,
        driver=driver,
        guard=request.user,
        license_plate_image=license_plate_image,
        driver_face_image=driver_face_image,
        shift=shift
    )
    
    return Response({'message': 'Verification completed', 'id': verification.id})

@api_view(['GET'])
@permission_classes([IsAuthenticated, IsGuard])
def guard_dashboard(request):
    """Guard dashboard - schedule and assigned drivers/vehicles"""
    today = datetime.now().date()
    
    # Guard's shift today
    guard_shift = Shift.objects.filter(
        user=request.user, 
        date=today, 
        shift_type='GUARD'
    ).first()
    
    # All drivers and vehicles for today
    driver_shifts = Shift.objects.filter(
        date=today,
        shift_type='DRIVER',
        org=request.user.org
    ).select_related('user', 'vehicle')
    
    return Response({
        'my_shift': {
            'start_time': guard_shift.start_time.strftime('%H:%M') if guard_shift else None,
            'end_time': guard_shift.end_time.strftime('%H:%M') if guard_shift else None,
        },
        'assigned_drivers': [
            {
                'id': shift.user.id,
                'name': shift.user.username,
                'vehicle': shift.vehicle.license_plate if shift.vehicle else None,
                'vehicle_id': shift.vehicle.id if shift.vehicle else None
            } for shift in driver_shifts
        ]
    })

# DRIVER FUNCTIONS

@api_view(['GET'])
@permission_classes([IsAuthenticated, IsDriver])
def driver_dashboard(request):
    """Driver dashboard - schedule and attendance history"""
    today = datetime.now().date()
    
    # Today's shift
    today_shift = Shift.objects.filter(
        user=request.user,
        date=today,
        shift_type='DRIVER'
    ).select_related('vehicle').first()
    
    # Recent attendance logs
    recent_attendance = AttendanceLog.objects.filter(
        user=request.user
    ).order_by('-timestamp')[:10]
    
    return Response({
        'todays_schedule': {
            'vehicle': today_shift.vehicle.license_plate if today_shift and today_shift.vehicle else None,
            'start_time': today_shift.start_time.strftime('%H:%M') if today_shift else None,
            'end_time': today_shift.end_time.strftime('%H:%M') if today_shift else None,
        },
        'attendance_history': [
            {
                'action': log.action,
                'timestamp': log.timestamp.strftime('%Y-%m-%d %H:%M'),
                'verified_by': log.verified_by.username if log.verified_by else 'Self'
            } for log in recent_attendance
        ]
    })

# SHARED FUNCTIONS

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def my_org_users(request):
    """Get users from same organization"""
    role_filter = request.query_params.get('role')
    users = User.objects.filter(org=request.user.org)
    
    if role_filter:
        users = users.filter(role=role_filter)
        
    return Response([
        {
            'id': user.id,
            'username': user.username, 
            'role': user.role
        } for user in users
    ])

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def my_org_vehicles(request):
    """Get vehicles from user's organization"""
    vehicles = Vehicle.objects.filter(org=request.user.org)
    return Response([
        {
            'id': v.id,
            'license_plate': v.license_plate,
            'make': v.make,
            'model': v.model,
            'status': v.status,
            'assigned_driver': v.assigned_driver.username if v.assigned_driver else None
        } for v in vehicles
    ])