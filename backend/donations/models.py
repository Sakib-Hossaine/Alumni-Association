import uuid
from django.conf import settings
from django.db import models
from alumni.models import AlumniProfile

class Donation(models.Model):
    class Method(models.TextChoices): CASH="CASH","Cash"; BANK="BANK","Bank transfer"; CARD="CARD","Card"; MOBILE="MOBILE","Mobile banking"
    class Status(models.TextChoices): PENDING="PENDING","Pending confirmation"; RECEIVED="RECEIVED","Received"; REJECTED="REJECTED","Rejected"
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    alumni = models.ForeignKey(AlumniProfile, on_delete=models.PROTECT, related_name="donations")
    amount = models.DecimalField(max_digits=10, decimal_places=2); donation_date = models.DateField(); purpose = models.CharField(max_length=160); payment_method = models.CharField(max_length=10, choices=Method.choices, default=Method.BANK); transaction_id = models.CharField(max_length=100, unique=True, null=True, blank=True); status = models.CharField(max_length=10, choices=Status.choices, default=Status.RECEIVED)
    recorded_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name="donations_recorded"); created_at = models.DateTimeField(auto_now_add=True)
