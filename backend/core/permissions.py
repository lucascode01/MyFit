"""
Role-based permissions for the API.
"""
from rest_framework import permissions


class IsAdmin(permissions.BasePermission):
    """Only admin users."""

    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and request.user.role == 'admin'


class IsProfessional(permissions.BasePermission):
    """Only professional or admin."""

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        return request.user.role in ('professional', 'admin')


class IsProfessionalOrReadOnly(permissions.BasePermission):
    """Professionals can write; authenticated users can read."""

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        if request.method in permissions.SAFE_METHODS:
            return True
        return request.user.role in ('professional', 'admin')


class IsOwnerOrAdmin(permissions.BasePermission):
    """Object-level: owner (professional) or admin."""

    def has_object_permission(self, request, view, obj):
        if request.user.role == 'admin':
            return True
        if hasattr(obj, 'professional'):
            return obj.professional.user_id == request.user.id
        if hasattr(obj, 'user_id'):
            return obj.user_id == request.user.id
        return False
