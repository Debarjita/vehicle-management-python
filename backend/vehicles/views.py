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
        traceback.print_exc()
        return Response({"error": str(e)}, status=500)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def decode_vin(request, vin):
    """Decode VIN using NHTSA API with improved error handling"""
    vin = vin.strip().upper()
    
    # Validate VIN format
    if not re.fullmatch(r'^[A-HJ-NPR-Z0-9]{17}$', vin):
        return Response({"error": "Invalid VIN format. Must be 17 characters."}, status=400)
    
    # Check cache first
    cached_data = cache.get(f"vin_{vin}")
    if cached_data:
        print(f"📋 Returning cached VIN data for {vin}")
        return Response(cached_data)
    
    # Handle test VIN
    if vin == "TEST123456789ABCD" or vin.startswith("TEST"):
        test_data = {
            "vin": vin,
            "make": "Toyota",
            "model": "Camry",
            "year": "2020",
            "manufacturer": "Toyota Motor Corporation",
            "body_class": "Sedan",
            "engine_hp": "203",
            "fuel_type": "Gasoline",
            "api_status": "test_data"
        }
        cache.set(f"vin_{vin}", test_data, timeout=3600)
        return Response(test_data)
    
    try:
        # Call NHTSA API
        url = f"https://vpic.nhtsa.dot.gov/api/vehicles/decodevinvalues/{vin}?format=json"
        print(f"🌐 Calling NHTSA API: {url}")
        
        response = requests.get(url, timeout=15)
        response.raise_for_status()
        
        data = response.json()
        if not data.get('Results'):
            return Response({"error": "No data returned from VIN service"}, status=400)
            
        result = data['Results'][0]
        
        # Extract information
        decoded_data = {
            "vin": vin,
            "make": result.get("Make", "").strip() or "Unknown",
            "model": result.get("Model", "").strip() or "Unknown", 
            "year": result.get("ModelYear", "").strip() or "Unknown",
            "manufacturer": result.get("Manufacturer", "").strip(),
            "body_class": result.get("BodyClass", "").strip(),
            "engine_hp": result.get("EngineHP", "").strip(),
            "fuel_type": result.get("FuelTypePrimary", "").strip(),
            "transmission": result.get("TransmissionStyle", "").strip(),
            "drive_type": result.get("DriveType", "").strip(),
            "vehicle_type": result.get("VehicleType", "").strip(),
        }
        
        # Check for API errors
        error_code = result.get("ErrorCode", "")
        error_text = result.get("ErrorText", "")
        
        if error_code:
            decoded_data["api_error_code"] = error_code
            decoded_data["api_error_text"] = error_text
            print(f"⚠️ NHTSA API warning for VIN {vin}: {error_code} - {error_text}")
        
        # If we got some useful data, proceed even with warnings
        has_useful_data = any([
            decoded_data["make"] != "Unknown",
            decoded_data["model"] != "Unknown", 
            decoded_data["year"] != "Unknown"
        ])
        
        if not has_useful_data and error_code and error_code not in ["0", "", "8"]:
            return Response({
                "error": f"VIN decode failed: {error_text or 'No detailed data available'}",
                "vin": vin,
                "suggestion": "Try with a different VIN or check if the VIN is correct"
            }, status=400)
        
        # Cache successful results
        cache.set(f"vin_{vin}", decoded_data, timeout=3600)
        
        print(f"✅ VIN {vin} decoded: {decoded_data['make']} {decoded_data['model']} {decoded_data['year']}")
        return Response(decoded_data)
        
    except requests.RequestException as e:
        print(f"🌐 Network error decoding VIN {vin}: {e}")
        return Response({
            "error": f"Failed to connect to VIN service: {str(e)}",
            "vin": vin
        }, status=500)
    except Exception as e:
        print(f"❌ Unexpected error decoding VIN {vin}: {e}")
        return Response({
            "error": f"VIN decode error: {str(e)}",
            "vin": vin
        }, status=500)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def vin_decode(request):
    """Alternative VIN decode endpoint for POST requests"""
    vin = request.data.get('vin', '').strip().upper()
    
    if not vin:
        return Response({"error": "VIN is required"}, status=400)
    
    # Create a fake request object to reuse the GET endpoint logic
    class FakeRequest:
        def __init__(self, user):
            self.user = user
    
    fake_request = FakeRequest(request.user)
    return decode_vin(fake_request, vin)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def add_vehicle(request):
    """Add a new vehicle - Admin adds to any org, Org Manager adds to their org"""
    vin = request.data.get('vin', '').strip().upper()
    org_name = request.data.get('org', '').strip()
    make = request.data.get('make', '').strip()
    model = request.data.get('model', '').strip()
    year = request.data.get('year')
    mileage = request.data.get('mileage')
    license_plate = request.data.get('license_plate', '').strip()

    print(f"🚗 Adding vehicle: VIN={vin}, org_name={org_name}, user={request.user} ({request.user.role})")

    if not re.fullmatch(r'^[A-HJ-NPR-Z0-9]{17}$', vin):

        return Response({"error": "Invalid VIN format."}, status=400)

    if Vehicle.objects.filter(vin=vin).exists():
        return Response({"error": "Vehicle already exists."}, status=400)

    # Handle organization assignment based on user role
    org = None
    if request.user.role == 'ADMIN':
        # Admin can specify any organization or leave it unassigned
        if org_name:
            try:
                org = Organization.objects.get(name=org_name)
                print(f"✅ Admin assigning vehicle to org: {org.name}")
            except Organization.DoesNotExist:
                return Response({"error": f"Organization '{org_name}' does not exist."}, status=400)
        else:
            print("ℹ️ Admin creating unassigned vehicle (goes to pool)")
    else:
        # Org Manager - vehicle goes to their organization
        org = request.user.org
        if not org:
            return Response({"error": "Organization manager must have an organization assigned"}, status=400)
        print(f"✅ Org Manager adding vehicle to their org: {org.name}")

    # Try to get decoded data from cache first
    decoded = cache.get(f"vin_{vin}")
    if not decoded:
        try:
            url = f"https://vpic.nhtsa.dot.gov/api/vehicles/decodevinvalues/{vin}?format=json"
            res = requests.get(url, timeout=10)
            data = res.json()
            result = data['Results'][0]
            decoded = {
                "make": result.get("Make", ""),
                "model": result.get("Model", ""),
                "year": result.get("ModelYear", ""),
            }
            cache.set(f"vin_{vin}", decoded, timeout=3600)
        except Exception as e:
            print(f"VIN decode error: {e}")
            # Continue with manual data if VIN decode fails
            decoded = {}

    # Create vehicle with provided or decoded data
    vehicle = Vehicle.objects.create(
        vin=vin,
        make=make or decoded.get('make', ''),
        model=model or decoded.get('model', ''),
        year=int(year) if year else (int(decoded.get('year')) if decoded.get('year') and decoded.get('year').isdigit() else None),
        mileage=int(mileage) if mileage else None,
        license_plate=license_plate,
        org=org,  # Assigned to org or None (goes to pool)
        status='AVAILABLE' if not org else 'ASSIGNED'
    )
    
    print(f"✅ Created vehicle: {vehicle.vin} -> {vehicle.org.name if vehicle.org else 'UNASSIGNED POOL'}")
    
    serializer = VehicleSerializer(vehicle)
    return Response({
        'message': f'Vehicle added successfully to {vehicle.org.name if vehicle.org else "vehicle pool"}',
        'vehicle': serializer.data
    }, status=201)


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

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def my_org_users(request):
    """Get users from same organization - FIXED"""
    print(f"🔍 my_org_users called by: {request.user.username} ({request.user.role}) in org: {request.user.org}")
    
    if not request.user.org:
        return Response({
            'error': 'User has no organization assigned',
            'users': []
        })
    
    role_filter = request.query_params.get('role')
    users = User.objects.filter(org=request.user.org)
    
    if role_filter:
        users = users.filter(role=role_filter)
    
    user_data = []
    for user in users:
        user_data.append({
            'id': user.id,
            'username': user.username, 
            'role': user.role
        })
    
    print(f"✅ Returning {len(user_data)} users for org {request.user.org.name}")
    return Response(user_data)

# Fix the my_org_vehicles endpoint  
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def my_org_vehicles(request):
    """Get vehicles from user's organization - FIXED"""
    print(f"🔍 my_org_vehicles called by: {request.user.username} in org: {request.user.org}")
    
    if not request.user.org:
        return Response([])
    
    vehicles = Vehicle.objects.filter(org=request.user.org)
    vehicle_data = []
    
    for vehicle in vehicles:
        vehicle_data.append({
            'id': vehicle.id,
            'license_plate': vehicle.license_plate,
            'make': vehicle.make,
            'model': vehicle.model,
            'vin': vehicle.vin,
            'status': vehicle.status,
            'assigned_driver': vehicle.assigned_driver.username if vehicle.assigned_driver else None
        })
    
    print(f"✅ Returning {len(vehicle_data)} vehicles for org {request.user.org.name}")
    return Response(vehicle_data)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_guard_or_driver(request):
    """Create guards/drivers for organization - FIXED"""
    username = request.data.get('username')
    password = request.data.get('password') 
    role = request.data.get('role')
    
    print(f"🔧 create_guard_or_driver called by: {request.user.username} ({request.user.role})")
    print(f"🔧 Creating: username={username}, role={role}, org={request.user.org}")
    
    if not username or not password or not role:
        return Response({'error': 'Username, password, and role are required'}, status=400)
    
    if role not in ['GUARD', 'DRIVER']:
        return Response({'error': 'Role must be GUARD or DRIVER'}, status=400)
    
    if not request.user.org:
        return Response({'error': 'User must have an organization assigned'}, status=400)
    
    # Check if username already exists
    if User.objects.filter(username=username).exists():
        return Response({'error': f'Username "{username}" already exists'}, status=400)
        
    try:
        # Create the user
        user = User.objects.create_user(
            username=username, 
            password=password, 
            role=role,
            org=request.user.org
        )
        
        print(f"✅ Created user: {user.username} ({user.role}) for org: {user.org.name}")
        
        return Response({
            'message': f'{role} "{username}" created successfully',
            'user_id': user.id,
            'username': user.username,
            'role': user.role,
            'org': user.org.name if user.org else None
        }, status=201)
        
    except Exception as e:
        print(f"❌ Error creating user: {e}")
        return Response({'error': f'Failed to create user: {str(e)}'}, status=500)
    

@api_view(['POST'])
@permission_classes([IsAdminOrOrgManager])
def claim_vehicles(request):
    """Org Manager or Admin claims vehicles from available pool"""
    vehicle_ids = request.data.get('vehicle_ids', [])
    org_id = request.data.get('org_id')  # For admin use
    
    if not vehicle_ids:
        return Response({'error': 'No vehicle IDs provided'}, status=400)
    
    if not isinstance(vehicle_ids, list):
        return Response({'error': 'vehicle_ids must be a list'}, status=400)
    
    # Determine target organization
    if request.user.role == 'ADMIN':
        if org_id:
            try:
                target_org = Organization.objects.get(id=org_id)
            except Organization.DoesNotExist:
                return Response({'error': 'Organization not found'}, status=400)
        else:
            return Response({'error': 'Admin must specify org_id'}, status=400)
    else:
        # Org Manager uses their own org
        target_org = request.user.org
        if not target_org:
            return Response({'error': 'User has no organization assigned'}, status=400)
    
    print(f"🚗 Claiming vehicles: {vehicle_ids} for org: {target_org.name} by user: {request.user}")
    
    updated = 0
    errors = []
    
    for vehicle_id in vehicle_ids:
        try:
            # Get vehicle that is currently available (no org assigned)
            vehicle = Vehicle.objects.get(id=vehicle_id, org__isnull=True)
            
            # Assign to target organization
            vehicle.org = target_org
            vehicle.status = 'ASSIGNED'  # Update status too
            vehicle.save()
            
            updated += 1
            print(f"✅ Claimed vehicle {vehicle_id}: {vehicle.license_plate or vehicle.vin} for {target_org.name}")
            
        except Vehicle.DoesNotExist:
            error_msg = f"Vehicle {vehicle_id} not found or already claimed"
            errors.append(error_msg)
            print(f"❌ {error_msg}")
        except Exception as e:
            error_msg = f"Error claiming vehicle {vehicle_id}: {str(e)}"
            errors.append(error_msg)
            print(f"❌ {error_msg}")
    
    response_data = {
        "claimed": updated,
        "requested": len(vehicle_ids),
        "organization": target_org.name,
        "errors": errors
    }
    
    if updated > 0:
        response_data["message"] = f"Successfully claimed {updated} vehicle(s) for {target_org.name}"
    
    status_code = 200 if updated > 0 else 400
    return Response(response_data, status=status_code)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def assign_driver_to_vehicle(request):
    """Assign driver to vehicle - FIXED"""
    driver_id = request.data.get('driver_id')
    vehicle_id = request.data.get('vehicle_id')
    
    print(f"🔧 assign_driver called: driver_id={driver_id}, vehicle_id={vehicle_id}")
    
    if not driver_id or not vehicle_id:
        return Response({'error': 'Both driver_id and vehicle_id are required'}, status=400)
    
    try:
        # Get driver and vehicle from same org
        driver = User.objects.get(id=driver_id, role='DRIVER', org=request.user.org)
        vehicle = Vehicle.objects.get(id=vehicle_id, org=request.user.org)
        
        # Assign driver to vehicle
        vehicle.assigned_driver = driver
        vehicle.status = 'ASSIGNED'
        vehicle.save()
        
        print(f"✅ Assigned driver {driver.username} to vehicle {vehicle.license_plate or vehicle.vin}")
        
        return Response({
            'message': f'Driver {driver.username} assigned to vehicle {vehicle.license_plate or vehicle.vin}',
            'driver': driver.username,
            'vehicle': vehicle.license_plate or vehicle.vin
        })
        
    except User.DoesNotExist:
        return Response({'error': 'Driver not found in your organization'}, status=404)
    except Vehicle.DoesNotExist:
        return Response({'error': 'Vehicle not found in your organization'}, status=404)
    except Exception as e:
        print(f"❌ Error assigning driver: {e}")
        return Response({'error': f'Failed to assign driver: {str(e)}'}, status=500)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def generate_schedules(request):
    """AI generates schedules for guards and drivers - FIXED VERSION"""
    try:
        print(f"🤖 Schedule generation called by: {request.user.username} ({request.user.role})")
        
        # Parse date or use today
        date_str = request.data.get('date')
        if date_str:
            try:
                schedule_date = datetime.strptime(date_str, '%Y-%m-%d').date()
            except ValueError:
                schedule_date = datetime.now().date()
        else:
            schedule_date = datetime.now().date()
        
        print(f"📅 Generating schedules for date: {schedule_date}")
        
        # Ensure user has organization (skip for admin)
        if request.user.role != 'ADMIN' and not request.user.org:
            return Response({'error': 'User must have an organization assigned'}, status=400)
        
        # Determine target organization
        if request.user.role == 'ADMIN':
            # Admin can generate for any org, default to first available
            target_org = Organization.objects.first()
            if not target_org:
                return Response({'error': 'No organizations found'}, status=400)
        else:
            target_org = request.user.org
        
        print(f"🏢 Target organization: {target_org.name}")
        
        # Get org's guards and drivers
        guards = User.objects.filter(org=target_org, role='GUARD')
        drivers = User.objects.filter(org=target_org, role='DRIVER')
        vehicles = Vehicle.objects.filter(org=target_org)
        
        print(f"👥 Found: {guards.count()} guards, {drivers.count()} drivers, {vehicles.count()} vehicles")
        
        if guards.count() == 0 and drivers.count() == 0:
            return Response({
                'error': 'No guards or drivers found in organization. Create some users first.',
                'organization': target_org.name
            }, status=400)
        
        # Delete existing schedules for this date to avoid duplicates
        deleted_count = Shift.objects.filter(org=target_org, date=schedule_date).delete()[0]
        if deleted_count > 0:
            print(f"🗑️ Deleted {deleted_count} existing shifts for {schedule_date}")
        
        guard_shifts_created = 0
        driver_shifts_created = 0
        
        # Create guard shifts (24-hour coverage) - FIXED TIME USAGE
        shift_times = [
            (time(6, 0), time(14, 0)),   # Morning 6AM-2PM
            (time(14, 0), time(22, 0)),  # Afternoon 2PM-10PM  
            (time(22, 0), time(6, 0))    # Night 10PM-6AM (next day)
        ]
        
        # Assign guards to shifts
        guard_list = list(guards)
        if guard_list:
            for i, (start_time, end_time) in enumerate(shift_times):
                if i < len(guard_list):  # Only create shifts if we have guards
                    guard = guard_list[i % len(guard_list)]  # Round-robin if more shifts than guards
                    
                    try:
                        shift = Shift.objects.create(
                            user=guard,
                            shift_type='GUARD',
                            date=schedule_date,
                            start_time=start_time,
                            end_time=end_time,
                            org=target_org,
                            is_active=True
                        )
                        guard_shifts_created += 1
                        print(f"   ✅ Created guard shift: {guard.username} {start_time}-{end_time}")
                    except Exception as e:
                        print(f"   ❌ Error creating guard shift for {guard.username}: {e}")
        
        # Create driver shifts for available vehicles - FIXED TIME USAGE
        available_vehicles = list(vehicles.filter(status__in=['AVAILABLE', 'ASSIGNED']))
        driver_list = list(drivers)
        
        if driver_list and available_vehicles:
            for i, vehicle in enumerate(available_vehicles):
                if i < len(driver_list):  # Only assign if we have drivers
                    driver = driver_list[i % len(driver_list)]  # Round-robin assignment
                    
                    try:
                        # Assign driver to vehicle first
                        vehicle.assigned_driver = driver
                        vehicle.status = 'ASSIGNED'
                        vehicle.save()
                        
                        # Create driver shift - FIXED TIME USAGE
                        shift = Shift.objects.create(
                            user=driver,
                            shift_type='DRIVER',
                            date=schedule_date,
                            start_time=time(8, 0),   # 8AM - Using time() correctly
                            end_time=time(17, 0),    # 5PM - Using time() correctly
                            vehicle=vehicle,
                            org=target_org,
                            is_active=True
                        )
                        driver_shifts_created += 1
                        print(f"   ✅ Created driver shift: {driver.username} with {vehicle.license_plate or vehicle.vin}")
                    except Exception as e:
                        print(f"   ❌ Error creating driver shift for {driver.username}: {e}")
        
        print(f"📊 Summary: {guard_shifts_created} guard shifts, {driver_shifts_created} driver shifts created")
        
        return Response({
            'success': True,
            'message': f'AI schedules generated successfully for {schedule_date}',
            'date': schedule_date.isoformat(),
            'guard_shifts': guard_shifts_created,
            'driver_shifts': driver_shifts_created,
            'organization': target_org.name,
            'details': {
                'total_guards_available': guards.count(),
                'total_drivers_available': drivers.count(),
                'total_vehicles_available': vehicles.count(),
                'shifts_created': guard_shifts_created + driver_shifts_created,
                'deleted_existing_shifts': deleted_count
            }
        })
        
    except Exception as e:
        print(f"❌ Error generating schedules: {e}")
        import traceback
        traceback.print_exc()
        return Response({
            'success': False,
            'error': f'Schedule generation failed: {str(e)}',
            'details': 'Check server logs for more information'
        }, status=500)
    
    
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

# SIMPLIFIED GUARD DASHBOARD
@api_view(['GET'])
@permission_classes([IsAuthenticated, IsGuard])
def guard_dashboard(request):
    """Simplified Guard dashboard - only assigned drivers and schedules"""
    today = datetime.now().date()
    
    # Guard's shift today
    guard_shift = Shift.objects.filter(
        user=request.user, 
        date=today, 
        shift_type='GUARD'
    ).first()
    
    # All driver shifts for today in this organization
    driver_shifts = Shift.objects.filter(
        date=today,
        shift_type='DRIVER',
        org=request.user.org,
        is_active=True
    ).select_related('user', 'vehicle').order_by('start_time')
    
    # Build driver list with vehicle assignments
    assigned_drivers = []
    for shift in driver_shifts:
        assigned_drivers.append({
            'id': shift.user.id,
            'name': shift.user.username,
            'vehicle': shift.vehicle.license_plate if shift.vehicle else 'No Vehicle',
            'vehicle_id': shift.vehicle.id if shift.vehicle else None,
            'shift_start': shift.start_time.strftime('%H:%M'),
            'shift_end': shift.end_time.strftime('%H:%M'),
            'status': 'Active' if shift.is_active else 'Inactive'
        })
    
    return Response({
        'my_shift': {
            'start_time': guard_shift.start_time.strftime('%H:%M') if guard_shift else None,
            'end_time': guard_shift.end_time.strftime('%H:%M') if guard_shift else None,
            'status': 'Active' if guard_shift and guard_shift.is_active else 'No Shift Today'
        },
        'assigned_drivers': assigned_drivers,
        'total_drivers_today': len(assigned_drivers)
    })

# SIMPLIFIED DRIVER DASHBOARD  
@api_view(['GET'])
@permission_classes([IsAuthenticated, IsDriver])
def driver_dashboard(request):
    """Simplified Driver dashboard - only assigned vehicle and schedule"""
    today = datetime.now().date()
    
    # Today's shift for this driver
    today_shift = Shift.objects.filter(
        user=request.user,
        date=today,
        shift_type='DRIVER'
    ).select_related('vehicle').first()
    
    # Get assigned vehicle info
    assigned_vehicle = Vehicle.objects.filter(assigned_driver=request.user).first()
    
    return Response({
        'assigned_vehicle': {
            'license_plate': assigned_vehicle.license_plate if assigned_vehicle else None,
            'make': assigned_vehicle.make if assigned_vehicle else None,
            'model': assigned_vehicle.model if assigned_vehicle else None,
            'vin': assigned_vehicle.vin if assigned_vehicle else None,
            'status': assigned_vehicle.status if assigned_vehicle else None
        } if assigned_vehicle else None,
        'todays_schedule': {
            'has_shift': bool(today_shift),
            'start_time': today_shift.start_time.strftime('%H:%M') if today_shift else None,
            'end_time': today_shift.end_time.strftime('%H:%M') if today_shift else None,
            'vehicle': today_shift.vehicle.license_plate if today_shift and today_shift.vehicle else None,
            'status': 'Active' if today_shift and today_shift.is_active else 'No Shift Today'
        }
    })

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
@permission_classes([IsAuthenticated])
def debug_org_manager(request):
    """Debug endpoint to see what data org manager should get"""
    user = request.user
    print(f"🔍 Debug for user: {user.username} ({user.role}) in org: {user.org}")
    
    # Check organization
    if not user.org:
        return Response({
            'error': 'User has no organization assigned',
            'user': user.username,
            'role': user.role
        })
    
    # Get all users in the same organization
    org_users = User.objects.filter(org=user.org)
    guards = org_users.filter(role='GUARD')
    drivers = org_users.filter(role='DRIVER')
    
    # Get all vehicles for this organization
    org_vehicles = Vehicle.objects.filter(org=user.org)
    
    # Get available vehicles (no org assigned)
    available_vehicles = Vehicle.objects.filter(org__isnull=True)
    
    return Response({
        'user_info': {
            'username': user.username,
            'role': user.role,
            'org_name': user.org.name if user.org else None,
            'org_id': user.org.id if user.org else None
        },
        'org_users': {
            'total': org_users.count(),
            'guards': list(guards.values('id', 'username', 'role')),
            'drivers': list(drivers.values('id', 'username', 'role'))
        },
        'vehicles': {
            'org_vehicles': list(org_vehicles.values('id', 'vin', 'license_plate', 'make', 'model', 'status', 'assigned_driver__username')),
            'available_vehicles': list(available_vehicles.values('id', 'vin', 'license_plate', 'make', 'model'))
        }
    })