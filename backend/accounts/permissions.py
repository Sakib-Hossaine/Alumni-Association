from rest_framework.permissions import BasePermission

class IsAdminRole(BasePermission):
    def has_permission(self, request, view): return bool(request.user.is_authenticated and request.user.role == "ADMIN")
class IsManagementOrAdmin(BasePermission):
    def has_permission(self, request, view): return bool(request.user.is_authenticated and request.user.role in ("ADMIN", "MANAGEMENT"))
class IsOwnerOrAdmin(BasePermission):
    def has_object_permission(self, request, view, obj):
        if request.user.role == "ADMIN": return True
        return getattr(obj, "user_id", None) == request.user.id or getattr(obj, "alumni", None) and obj.alumni.user_id == request.user.id
