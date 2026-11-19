from django.db.models import Sum, Count, Q
from django.db.models.functions import TruncMonth
from rest_framework import viewsets, serializers
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView
from rest_framework.response import Response
from accounts.permissions import IsManagementOrAdmin
from .models import Donation
from rest_framework.decorators import action
from alumni.models import AlumniProfile
from events.models import Event

class DonationSerializer(serializers.ModelSerializer):
    alumni_name = serializers.CharField(source="alumni.full_name", read_only=True)
    class Meta: model = Donation; fields = "__all__"; read_only_fields = ["id", "recorded_by", "created_at"]
    def validate_transaction_id(self, value): return value or None
    def validate_amount(self, value):
        if value <= 0: raise serializers.ValidationError("Donation amount must be greater than zero.")
        return value
class DonationViewSet(viewsets.ModelViewSet):
    serializer_class = DonationSerializer
    filterset_fields = {"purpose": ["exact", "icontains"], "payment_method": ["exact"], "donation_date": ["gte", "lte"]}
    def get_queryset(self):
        qs = Donation.objects.select_related("alumni")
        return qs if self.request.user.role in ("ADMIN", "MANAGEMENT") else qs.filter(alumni__user=self.request.user)
    def get_permissions(self):
        if self.action in ("list", "update", "partial_update", "destroy"): return [IsAuthenticated(), IsManagementOrAdmin()]
        return [IsAuthenticated()]
    def get_serializer(self, *args, **kwargs):
        serializer = super().get_serializer(*args, **kwargs)
        if self.request.user.role == "ALUMNI":
            serializer.fields["alumni"].required = False
            serializer.fields["status"].read_only = True
        return serializer
    def perform_create(self, serializer):
        if self.request.user.role == "ALUMNI":
            profile = AlumniProfile.objects.filter(user=self.request.user, is_deleted=False).first()
            if not profile: raise serializers.ValidationError({"detail": "Complete your alumni profile before submitting a donation."})
            serializer.save(alumni=profile, recorded_by=self.request.user, status=Donation.Status.PENDING)
        else:
            serializer.save(recorded_by=self.request.user)
    @classmethod
    def as_view(cls, actions=None, **initkwargs): return super().as_view(actions, **initkwargs)
    @action(detail=False, methods=["get"], url_path="my-donations")
    def my_donations(self, request): return Response(DonationSerializer(self.get_queryset().filter(alumni__user=request.user), many=True).data)
class AnalyticsView(APIView):
    permission_classes = [IsAuthenticated, IsManagementOrAdmin]
    def get(self, request):
        years = AlumniProfile.objects.filter(is_deleted=False, graduation_year__isnull=False).values("graduation_year").annotate(count=Count("id")).order_by("graduation_year")
        # Truncation happens in SQL; format the month label for the chart contract.
        received = Donation.objects.filter(status=Donation.Status.RECEIVED)
        donation_trend = received.annotate(month=TruncMonth("donation_date")).values("month").annotate(total=Sum("amount")).order_by("month")
        attendance = Event.objects.annotate(registered=Count("attendees"), attended=Count("attendees", filter=Q(attendees__attended=True))).values("id", "title", "registered", "attended").order_by("event_date")
        return Response({
            "alumni_count": AlumniProfile.objects.filter(is_deleted=False).count(),
            "donation_total": received.aggregate(total=Sum("amount"))["total"] or 0,
            "donation_count": received.count(),
            "event_count": Event.objects.count(),
            "graduation_year_distribution": list(years),
            "donation_trend": [{"month": item["month"].strftime("%Y-%m"), "amount": item["total"]} for item in donation_trend if item["month"]],
            "event_attendance": list(attendance),
        })
