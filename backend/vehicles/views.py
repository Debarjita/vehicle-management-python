# backend/vehicles/views.py
from rest_framework import viewsets, status
from rest_framework.decorators import api_view, authentication_classes, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.authentication import TokenAuthentication
from .models import Vehicle, Organization
from .serializers import VehicleSerializer, RecursiveOrgSerializer
from django.core.cache import cache

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
@authentication_classes([TokenAuthentication])
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
        return Response({"error": str(e)}, status=500)

# VIN Decoding from Request
@api_view(['POST'])
@authentication_classes([TokenAuthentication])
@permission_classes([IsAuthenticated])
def vin_decode(request):
    vin = request.data.get('vin', '')
    return decode_vin(request, vin)

# NHTSA VIN Decode with caching + rate limit
@api_view(['GET'])
@authentication_classes([TokenAuthentication])
@permission_classes([IsAuthenticated])
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
        return Response(decoded)
    except Exception as e:
        return Response({"error": str(e)}, status=500)

# POST /api/vehicles
@api_view(['POST'])
@authentication_classes([TokenAuthentication])
@permission_classes([IsAuthenticated])
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

# GET /api/orgs-list/
@api_view(['GET'])
@authentication_classes([TokenAuthentication])
@permission_classes([IsAuthenticated])
def get_all_organizations(request):
    root_orgs = Organization.objects.filter(parent__isnull=True)
    serializer = RecursiveOrgSerializer(root_orgs, many=True)
    return Response(serializer.data)
