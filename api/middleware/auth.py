# middleware/auth.py
from django.conf import settings
from django.http import JsonResponse
from rest_framework import status
from rest_framework_simplejwt.tokens import AccessToken
from jwt.exceptions import InvalidTokenError, ExpiredSignatureError

class JWTAuthMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        # Skip auth check for certain paths if needed
        # if request.path in ['/api/login/', '/api/register/']:
        #     return self.get_response(request)

        # Extract token from Authorization header
        auth_header = request.META.get('HTTP_AUTHORIZATION', '')
        if auth_header.startswith('Bearer '):
            token = auth_header.split(' ')[1]
        else:
            token = None

        # No token provided
        if not token:
            return JsonResponse(
                {'message': 'No token provided'}, 
                status=status.HTTP_401_UNAUTHORIZED
            )

        # Verify token
        try:
            # Decode and validate the token
            access_token = AccessToken(token)
            
            # Attach user info to request
            request.user_id = access_token.get('user_id')
            request.user_role = access_token.get('role')
            
            # Continue to the next middleware or view
            return self.get_response(request)
            
        except (InvalidTokenError, ExpiredSignatureError):
            return JsonResponse(
                {'message': 'Invalid token'}, 
                status=status.HTTP_401_UNAUTHORIZED
            )
        except Exception:
            return JsonResponse(
                {'message': 'Authentication error'}, 
                status=status.HTTP_401_UNAUTHORIZED
            )