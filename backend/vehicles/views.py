# backend/vehicles/views.py
from rest_framework import viewsets, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404
from .models import Vehicle, Organization,EntryLog
from .serializers import VehicleSerializer, RecursiveOrgSerializer,EntryLogSerializer
from django.core.cache import cache
from accounts.permissions import IsAdmin, IsGuard, IsOrgManager
from rest_framework.decorators import permission_classes
from accounts.permissions import IsAdminOrOrgManager

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