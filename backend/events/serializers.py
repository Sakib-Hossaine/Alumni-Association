from rest_framework import serializers
from .models import Event, EventAttendance
class EventAttendanceSerializer(serializers.ModelSerializer):
    alumni_name = serializers.CharField(source="alumni.full_name", read_only=True)
    class Meta: model = EventAttendance; fields = ["id", "event", "alumni", "alumni_name", "registration_date", "attended"]; read_only_fields = ["id", "registration_date"]
class EventSerializer(serializers.ModelSerializer):
    registration_count = serializers.IntegerField(source="attendees.count", read_only=True)
    is_registered = serializers.SerializerMethodField()
    class Meta: model = Event; fields = "__all__"; read_only_fields = ["id", "created_by", "created_at", "updated_at"]
    def get_is_registered(self, obj):
        user = self.context["request"].user
        return obj.attendees.filter(alumni__user=user).exists()
