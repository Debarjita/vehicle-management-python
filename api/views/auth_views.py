# views/auth_views.py
from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import get_user_model, authenticate
from django.conf import settings

User = get_user_model()

@api_view(['POST'])
def login(request):
    """
    Generate JWT token upon successful user login
    """
    username = request.data.get('username')
    password = request.data.get('password')
    
    # Authenticate user using Django's authentication
    user = authenticate(username=username, password=password)
    
    if not user:
        return Response(
            {'message': 'Invalid credentials'}, 
            status=status.HTTP_401_UNAUTHORIZED
        )

    # Generate JWT token using SimpleJWT
    refresh = RefreshToken.for_user(user)
    
    # Include user role in token payload
    refresh['role'] = user.role  # Assuming your User model has a role field
    
    return Response({
        'token': str(refresh.access_token)
    })