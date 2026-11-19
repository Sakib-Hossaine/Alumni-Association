from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import CustomUser

@admin.register(CustomUser)
class CustomUserAdmin(UserAdmin):
    fieldsets = UserAdmin.fieldsets + (("Alumni access", {"fields": ("role", "phone", "is_verified")}),)
    add_fieldsets = UserAdmin.add_fieldsets + (("Alumni access", {"fields": ("email", "role", "phone")}),)
    list_display = ("username", "email", "first_name", "last_name", "role", "is_staff", "is_verified")
    search_fields = ("username", "email", "first_name", "last_name")
