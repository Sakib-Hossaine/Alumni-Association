from django.utils import timezone
from rest_framework import viewsets, serializers
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework.decorators import action
from accounts.permissions import IsAdminRole, IsManagementOrAdmin
from .models import Batch, AlumniProfile, GalleryImage
from .serializers import BatchSerializer, AlumniReadSerializer, AlumniWriteSerializer, DirectorySerializer, GalleryImageSerializer
from .filters import AlumniFilter

class BatchViewSet(viewsets.ModelViewSet):
    serializer_class = BatchSerializer
    def get_queryset(self):
        qs = Batch.objects.all()
        if self.request.query_params.get("include_inactive") != "true": qs = qs.filter(is_active=True)
        return qs
    def get_permissions(self):
        return [IsAuthenticated(), IsAdminRole()] if self.action in ("create", "update", "partial_update", "destroy") else [IsAuthenticated()]
    def perform_create(self, serializer): serializer.save(created_by=self.request.user)
    def perform_destroy(self, instance): instance.is_active = False; instance.save(update_fields=["is_active", "updated_at"])

class AlumniViewSet(viewsets.ModelViewSet):
    filterset_class = AlumniFilter
    search_fields = ["full_name", "student_id"]
    def get_queryset(self):
        qs = AlumniProfile.objects.filter(is_deleted=False).select_related("user", "batch").prefetch_related("employments")
        if self.request.user.role == "ALUMNI": qs = qs.filter(user=self.request.user)
        return qs
    def get_serializer_class(self): return AlumniReadSerializer if self.action in ("list", "retrieve", "me") else AlumniWriteSerializer
    def get_permissions(self):
        if self.action == "photo": return [IsAuthenticated(), IsManagementOrAdmin()]
        if self.action == "destroy": return [IsAuthenticated(), IsAdminRole()]
        if self.action == "list": return [IsAuthenticated(), IsManagementOrAdmin()]
        if self.action == "create": return [IsAuthenticated(), IsManagementOrAdmin()]
        return [IsAuthenticated()]
    def perform_destroy(self, instance): instance.is_deleted=True; instance.deleted_at=timezone.now(); instance.save(update_fields=["is_deleted", "deleted_at"])
    @action(detail=False, methods=["get"])
    def me(self, request):
        profile = AlumniProfile.objects.filter(user=request.user, is_deleted=False).first()
        if not profile: return Response({"detail": "Alumni profile not found."}, status=404)
        return Response(AlumniReadSerializer(profile, context={"request": request}).data)

    @action(detail=True, methods=["patch"], parser_classes=[MultiPartParser, FormParser], url_path="photo")
    def photo(self, request, pk=None):
        if set(request.data.keys()) != {"profile_photo"}:
            raise serializers.ValidationError({"detail": "Upload only the profile_photo field."})
        profile = self.get_object()
        serializer = AlumniWriteSerializer(profile, data=request.data, partial=True, context=self.get_serializer_context())
        serializer.is_valid(raise_exception=True)
        profile = serializer.save()
        return Response(AlumniReadSerializer(profile, context=self.get_serializer_context()).data)

    @action(detail=False, methods=["get"], permission_classes=[IsAuthenticated])
    def directory(self, request):
        qs = AlumniProfile.objects.filter(is_deleted=False).select_related("batch").prefetch_related("employments").order_by("batch__number", "full_name")
        search = request.query_params.get("search")
        batch = request.query_params.get("batch")
        if search: qs = qs.filter(full_name__icontains=search)
        if batch: qs = qs.filter(batch_id=batch)
        return Response(DirectorySerializer(qs, many=True, context=self.get_serializer_context()).data)

class GalleryImageViewSet(viewsets.ModelViewSet):
    serializer_class = GalleryImageSerializer
    http_method_names = ["get", "post", "delete", "head", "options"]
    def get_queryset(self): return GalleryImage.objects.filter(is_active=True)
    def get_permissions(self):
        return [AllowAny()] if self.action in ("list", "retrieve") else [IsAuthenticated(), IsManagementOrAdmin()]
    def perform_create(self, serializer): serializer.save(uploaded_by=self.request.user)
    def perform_destroy(self, instance): instance.is_active = False; instance.save(update_fields=["is_active"])
