# views/org_views.py
from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from ..models import Organization
from ..utils.update_child_org_policies import update_child_org_policies  # We'll create this utility later

@api_view(['POST'])
def create_org(request):
    """
    Create a new organization with optional default values
    """
    try:
        org_data = {
            'name': request.data['name'],
            'account': request.data['account'],
            'website': request.data.get('website'),
            'fuel_reimbursement_policy': request.data.get('fuelReimbursementPolicy', '1000'),
            'speed_limit_policy': request.data.get('speedLimitPolicy', '50 km/h'),
            'parent_org_id': request.data.get('parentOrg')
        }
        
        org = Organization.objects.create(**org_data)
        return Response(org.to_dict(), status=status.HTTP_201_CREATED)
    except Exception as error:
        return Response(
            {'message': 'Error creating organization'}, 
            status=status.HTTP_400_BAD_REQUEST
        )

@api_view(['GET'])
def get_all_orgs(request):
    """
    Get paginated list of organizations
    """
    try:
        # Get pagination parameters with defaults
        page = int(request.query_params.get('page', 1))
        limit = int(request.query_params.get('limit', 10))
        offset = (page - 1) * limit
        
        # Get paginated organizations
        organizations = Organization.objects.all()[offset:offset + limit]
        
        # Convert to list of dictionaries
        org_list = [org.to_dict() for org in organizations]
        
        return Response(org_list, status=status.HTTP_200_OK)
    except Exception as error:
        return Response(
            {'message': 'Error retrieving organizations'}, 
            status=status.HTTP_400_BAD_REQUEST
        )

@api_view(['PUT'])
def update_org(request, org_id):
    """
    Update organization and propagate policy changes if needed
    """
    try:
        # Get organization or return 404
        org = get_object_or_404(Organization, id=org_id)
        
        # Update policies if provided
        if 'fuelReimbursementPolicy' in request.data:
            org.fuel_reimbursement_policy = request.data['fuelReimbursementPolicy']
        
        if 'speedLimitPolicy' in request.data:
            org.speed_limit_policy = request.data['speedLimitPolicy']
        
        # Save changes
        org.save()
        
        # Propagate changes to child organizations if parent exists
        if org.parent_org:
            await update_child_org_policies(org)
        
        return Response(org.to_dict())
    
    except Organization.DoesNotExist:
        return Response(
            {'error': 'Organization not found'}, 
            status=status.HTTP_404_NOT_FOUND
        )
    except Exception as error:
        return Response(
            {'error': str(error)}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )