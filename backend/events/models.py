import uuid
from django.conf import settings
from django.db import models
from alumni.models import AlumniProfile

class Event(models.Model):
    class Type(models.TextChoices): REUNION="REUNION","Reunion"; NETWORKING="NETWORKING","Networking"; WORKSHOP="WORKSHOP","Workshop"; OTHER="OTHER","Other"
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    title = models.CharField(max_length=180); event_type = models.CharField(max_length=20, choices=Type.choices, default=Type.OTHER); event_date = models.DateTimeField(); venue = models.CharField(max_length=180); description = models.TextField(blank=True); is_published = models.BooleanField(default=False)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name="events_created")
    created_at = models.DateTimeField(auto_now_add=True); updated_at = models.DateTimeField(auto_now=True)
    class Meta: ordering = ["event_date"]
class EventAttendance(models.Model):
    event = models.ForeignKey(Event, on_delete=models.CASCADE, related_name="attendees"); alumni = models.ForeignKey(AlumniProfile, on_delete=models.CASCADE, related_name="event_registrations"); registration_date = models.DateTimeField(auto_now_add=True); attended = models.BooleanField(default=False)
    class Meta: unique_together = [("event", "alumni")]
