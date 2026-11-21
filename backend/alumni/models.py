import uuid
from django.conf import settings
from django.db import models

class Batch(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    number = models.CharField(max_length=20, unique=True)
    year = models.PositiveIntegerField(null=True, blank=True)
    description = models.TextField(blank=True, null=True)
    is_active = models.BooleanField(default=True)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, on_delete=models.SET_NULL, related_name="created_batches")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    class Meta:
        db_table = "alumni_batch"
        ordering = ["-year", "number"]
        indexes = [models.Index(fields=["number"]), models.Index(fields=["is_active"])]
    def __str__(self): return self.number

class AlumniProfile(models.Model):
    class Gender(models.TextChoices):
        MALE = "MALE", "Male"
        FEMALE = "FEMALE", "Female"
        OTHER = "OTHER", "Other"
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.OneToOneField(settings.AUTH_USER_MODEL, related_name="profile", on_delete=models.CASCADE)
    student_id = models.CharField(max_length=50, unique=True)
    full_name = models.CharField(max_length=150)
    preferred_name = models.CharField(max_length=100, blank=True, null=True)
    gender = models.CharField(max_length=10, choices=Gender.choices, default=Gender.OTHER)
    date_of_birth = models.DateField(null=True, blank=True)
    nationality = models.CharField(max_length=100, blank=True, null=True)
    profile_photo = models.ImageField(upload_to="alumni/", blank=True, null=True)
    graduation_year = models.PositiveIntegerField(null=True, blank=True, db_index=True)
    major = models.CharField(max_length=100, default="Computer Science", editable=False)
    batch = models.ForeignKey(Batch, on_delete=models.SET_NULL, null=True, blank=True, related_name="alumni", db_index=True)
    bio = models.TextField(blank=True, null=True)
    is_deleted = models.BooleanField(default=False)
    deleted_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    class Meta:
        db_table = "alumni_profile"
        ordering = ["-graduation_year", "full_name"]
        indexes = [models.Index(fields=["student_id"]), models.Index(fields=["batch"])]
    def save(self, *args, **kwargs): self.major = "Computer Science"; super().save(*args, **kwargs)
    def __str__(self): return f"{self.full_name} ({self.student_id})"

class ContactInfo(models.Model):
    profile = models.OneToOneField(AlumniProfile, on_delete=models.CASCADE, related_name="contact")
    personal_email = models.EmailField(blank=True)
    work_email = models.EmailField(blank=True)
    mobile_phone = models.CharField(max_length=30, blank=True)
    work_phone = models.CharField(max_length=30, blank=True)
    current_city = models.CharField(max_length=100, blank=True)
    current_country = models.CharField(max_length=100, blank=True)
    address_line = models.CharField(max_length=255, blank=True)
    postal_code = models.CharField(max_length=20, blank=True)
    email_verified_at = models.DateTimeField(null=True, blank=True)
    data_verified_at = models.DateTimeField(null=True, blank=True)
class Employment(models.Model):
    class Industry(models.TextChoices): TECHNOLOGY="TECHNOLOGY","Technology"; EDUCATION="EDUCATION","Education"; FINANCE="FINANCE","Finance"; OTHER="OTHER","Other"
    class Status(models.TextChoices): FULL_TIME="FULL_TIME","Full time"; PART_TIME="PART_TIME","Part time"; SELF_EMPLOYED="SELF_EMPLOYED","Self employed"; OTHER="OTHER","Other"
    profile = models.ForeignKey(AlumniProfile, on_delete=models.CASCADE, related_name="employments")
    company_name = models.CharField(max_length=150)
    job_title = models.CharField(max_length=150)
    industry = models.CharField(max_length=20, choices=Industry.choices, default=Industry.OTHER)
    employment_status = models.CharField(max_length=20, choices=Status.choices, default=Status.FULL_TIME)
    work_city = models.CharField(max_length=100, blank=True); work_country = models.CharField(max_length=100, blank=True)
    linkedin_url = models.URLField(blank=True); start_date = models.DateField(null=True, blank=True); end_date = models.DateField(null=True, blank=True); is_current = models.BooleanField(default=False)
class EngagementPreference(models.Model):
    class Channel(models.TextChoices): EMAIL="EMAIL","Email"; PHONE="PHONE","Phone"; SMS="SMS","SMS"
    class Frequency(models.TextChoices): WEEKLY="WEEKLY","Weekly"; MONTHLY="MONTHLY","Monthly"; QUARTERLY="QUARTERLY","Quarterly"
    profile = models.OneToOneField(AlumniProfile, on_delete=models.CASCADE, related_name="engagement_preference")
    interested_in_mentoring = models.BooleanField(default=False); interested_in_guest_speaking = models.BooleanField(default=False); interested_in_donating = models.BooleanField(default=False); interested_in_volunteering = models.BooleanField(default=False)
    preferred_communication_channel = models.CharField(max_length=10, choices=Channel.choices, default=Channel.EMAIL); communication_frequency = models.CharField(max_length=12, choices=Frequency.choices, default=Frequency.MONTHLY)

class ConsentRecord(models.Model):
    profile = models.OneToOneField(AlumniProfile, on_delete=models.CASCADE, related_name="consent")
    gdpr_consent = models.BooleanField(default=False)
    consent_date = models.DateTimeField(null=True, blank=True)
    data_retention_until = models.DateField(null=True, blank=True)

class GalleryImage(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    image = models.ImageField(upload_to="gallery/%Y/%m/")
    caption = models.CharField(max_length=200, blank=True)
    uploaded_by = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL, related_name="gallery_images")
    created_at = models.DateTimeField(auto_now_add=True)
    is_active = models.BooleanField(default=True)
    class Meta:
        ordering = ["-created_at"]
    def __str__(self): return self.caption or f"Gallery image {self.pk}"


class MediaAsset(models.Model):
    name = models.CharField(max_length=500, primary_key=True)
    content = models.BinaryField()
