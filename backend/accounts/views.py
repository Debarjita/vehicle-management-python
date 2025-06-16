from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework.permissions import IsAuthenticated
from accounts.permissions import IsAdmin
from vehicles.models import Organization
from rest_framework.decorators import api_view, permission_classes,authentication_classes
from rest_framework.response import Response
from accounts.models import User
from accounts.serializers import UserListSerializer
from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.authentication import BasicAuthentication, SessionAuthentication 
from rest_framework.permissions import AllowAny


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token['role'] = user.role  # ✅ Add role to token payload
        return token

    def validate(self, attrs):
        data = super().validate(attrs)
        data['role'] = self.user.role  # ✅ Add role to response body
        return data

class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer

@api_view(['POST'])
@permission_classes([IsAuthenticated, IsAdmin])
def create_user_with_role(request):
    username = request.data.get('username')
    password = request.data.get('password')
    role = request.data.get('role')
    org_id = request.data.get('org')  # optional

    if not username or not password or not role:
        return Response({'error': 'Missing fields'}, status=400)
    org = None  # ✅ initialize default
    if role != 'ADMIN':  # only non-admins need an org
        if not org_id:
            return Response({'error': 'org is required for this role'}, status=400)
        try:
            org = Organization.objects.get(pk=org_id)
        except Organization.DoesNotExist:
            return Response({'error': 'Organization not found'}, status=404)
      
    user = User.objects.create_user(username=username, password=password, role=role, org=org)
    return Response({'message': 'User created successfully ✅'})


# ✅ List all users (or filter by org)
@api_view(['GET'])
@permission_classes([IsAuthenticated, IsAdmin])
def list_users(request):
    org_id = request.query_params.get('org')
    users = User.objects.all()
    if org_id:
        users = users.filter(org__id=org_id)
    serializer = UserListSerializer(users, many=True)
    return Response(serializer.data)

# ✅ Edit a user (role/org)
@api_view(['PATCH'])
@permission_classes([IsAuthenticated, IsAdmin])
def update_user(request, user_id):
    try:
        user = User.objects.get(id=user_id)
    except User.DoesNotExist:
        return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)

    user.role = request.data.get('role', user.role)
    org_id = request.data.get('org')
    if org_id:
        try:
            org = Organization.objects.get(id=org_id)
            user.org = org
        except Organization.DoesNotExist:
            return Response({'error': 'Org not found'}, status=404)
    user.save()
    return Response({'message': 'User updated successfully'})

User = get_user_model()

@api_view(['POST'])
@permission_classes([IsAuthenticated])  # they must be logged in
def update_password(request):
    user = request.user
    password = request.data.get("password")
    confirm_password = request.data.get("confirm_password")

    if password != confirm_password:
        return Response({"error": "Passwords do not match"}, status=400)

    user.set_password(password)
    user.save()
    return Response({"success": "Password updated successfully"})
