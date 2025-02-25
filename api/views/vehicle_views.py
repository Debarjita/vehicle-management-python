# views/vehicle_views.py
import re
import requests
from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response
from django.conf import settings
from django.core.cache import cache
from ..models import Vehicle, Organization

@api_view(['GET'])
def decode_vin(request, vin):
    """
    Decode Vehicle Identification Number (VIN) using NHTSA API
    Checks cache first, then calls external API if needed
    """
    # Check if data is in cache
    cached_data = cache.get(f'vin_{vin}')
    if cached_data:
        return Response(cached_data)
    
    try:
        # Call NHTSA API
        response = requests.get(
            f"{settings.NHTSA_API_URL}vehicles/DecodeVin/{vin}?format=json"
        )
        details = response.json()['Results']
        
        # Cache the results (timeout in seconds, here 24 hours)
        cache.set(f'vin_{vin}', details, 86400)
        
        return Response(details)
    except Exception as error:
        return Response(
            {'message': 'Error decoding VIN'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['POST'])
def add_vehicle(request):
    """
    Add a new vehicle to the database
    Validates VIN format, organization existence, and calls the VIN decoding API
    """
    vin = request.data.get('vin')
    org_id = request.data.get('org')
    
    # Check if vehicle already exists
    if Vehicle.objects.filter(vin=vin).exists():
        return Response(
            {'message': 'Vehicle with this VIN already exists'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        # Validate VIN format (17 alphanumeric characters)
        if not re.match(r'^[a-zA-Z0-9]{17}$', vin):
            return Response(
                {'message': 'Invalid VIN format'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Verify organization exists
        try:
            organization = Organization.objects.get(id=org_id)
        except Organization.DoesNotExist:
            return Response(
                {'message': 'Organization not found'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Decode VIN via NHTSA API
        response = requests.get(
            f"{settings.NHTSA_API_URL}vehicles/DecodeVin/{vin}?format=json"
        )
        details = response.json()['Results']
        
        # Create and save vehicle
        vehicle = Vehicle.objects.create(
            vin=vin,
            org=organization,
            details=details
        )
        
        return Response(vehicle.to_dict(), status=status.HTTP_201_CREATED)
    
    except Exception as error:
        return Response(
            {'message': 'Error adding vehicle'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )