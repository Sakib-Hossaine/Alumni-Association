import uuid
from django.contrib.auth.models import AbstractUser
from django.db import models

class CustomUser(AbstractUser):
    class Role(models.TextChoices):
        ADMIN = "ADMIN", "Admin"
        MANAGEMENT = "MANAGEMENT", "Management"
        ALUMNI = "ALUMNI", "Alumni"
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    email = models.EmailField(unique=True)
    role = models.CharField(max_length=12, choices=Role.choices, default=Role.ALUMNI)
    is_verified = models.BooleanField(default=False)
    phone = models.CharField(max_length=30, unique=True, null=True, blank=True)
    profile_photo = models.ImageField(upload_to="profiles/", blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["username"]
    @property
    def is_admin(self): return self.role == self.Role.ADMIN
    @property
    def is_management(self): return self.role == self.Role.MANAGEMENT
    @property
    def is_alumni(self): return self.role == self.Role.ALUMNI
    def __str__(self): return self.email
