from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from accounts.permissions import IsManagementOrAdmin
from alumni.models import AlumniProfile
from .models import Event, EventAttendance
from .serializers import EventSerializer, EventAttendanceSerializer

class EventViewSet(viewsets.ModelViewSet):
    serializer_class = EventSerializer
    filterset_fields = {"event_type": ["exact"], "is_published": ["exact"], "event_date": ["gte", "lte"]}
    def get_queryset(self):
        qs = Event.objects.all()
        if self.request.user.role == "ALUMNI": qs = qs.filter(is_published=True)
        return qs
    def get_permissions(self): return [IsAuthenticated(), IsManagementOrAdmin()] if self.action in ("create", "update", "partial_update", "destroy", "attendees", "update_attendance") else [IsAuthenticated()]
    def perform_create(self, serializer): serializer.save(created_by=self.request.user)
    @action(detail=True, methods=["post"])
    def register(self, request, pk=None):
        profile = AlumniProfile.objects.filter(user=request.user, is_deleted=False).first()
        if not profile: return Response({"detail": "Create an alumni profile before registering."}, status=400)
        _, created = EventAttendance.objects.get_or_create(event=self.get_object(), alumni=profile)
        return Response({"registered": True, "created": created})
    @action(detail=True, methods=["delete"])
    def cancel(self, request, pk=None):
        EventAttendance.objects.filter(event=self.get_object(), alumni__user=request.user).delete(); return Response(status=204)
    @action(detail=True, methods=["get"], permission_classes=[IsAuthenticated, IsManagementOrAdmin])
    def attendees(self, request, pk=None):
        records = self.get_object().attendees.select_related("alumni").order_by("alumni__full_name")
        return Response(EventAttendanceSerializer(records, many=True).data)
    @action(detail=True, methods=["patch"], url_path=r"attendees/(?P<attendance_id>[^/.]+)", permission_classes=[IsAuthenticated, IsManagementOrAdmin])
    def update_attendance(self, request, pk=None, attendance_id=None):
        record = self.get_object().attendees.filter(pk=attendance_id).first()
        if not record: return Response({"detail": "Registration not found."}, status=404)
        record.attended = bool(request.data.get("attended", record.attended)); record.save(update_fields=["attended"])
        return Response(EventAttendanceSerializer(record).data)
