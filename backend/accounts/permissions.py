from rest_framework.permissions import BasePermission


class IsAdmin(BasePermission):
    def has_permission(self, request, view):
        print("🔐 Checking IsAdmin:", request.user, getattr(request.user, 'role', 'NO_ROLE'))
        return request.user.is_authenticated and request.user.role == 'ADMIN'

class IsGuard(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'GUARD'

class IsDriver(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'DRIVER'

class IsOrgManager(BasePermission):
    def has_permission(self, request, view):
        print("🔐 Checking IsOrgManager:", request.user, getattr(request.user, 'role', 'NO_ROLE'))
        return request.user.is_authenticated and request.user.role == 'ORG_MANAGER'

class IsAdminOrOrgManager(BasePermission):
    def has_permission(self, request, view):
        role = getattr(request.user, 'role', None)
        print("🔐 IsAdminOrOrgManager check:", request.user, role)
        return request.user.is_authenticated and role in ['ADMIN', 'ORG_MANAGER']