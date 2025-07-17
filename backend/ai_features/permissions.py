# backend/ai_features/permissions.py
from rest_framework.permissions import BasePermission

class CanRegisterFaces(BasePermission):
    """
    Permission to register faces for users
    """
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role in ['ADMIN', 'ORG_MANAGER']

class CanVerifyFaces(BasePermission):
    """
    Permission to verify faces
    """
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role in ['ADMIN', 'ORG_MANAGER', 'GUARD', 'DRIVER']

class CanScanLicensePlates(BasePermission):
    """
    Permission to scan license plates
    """
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role in ['ADMIN', 'ORG_MANAGER', 'GUARD']
