from django.contrib import admin
from .models import Batch, AlumniProfile, ContactInfo, Employment, EngagementPreference, ConsentRecord, GalleryImage
admin.site.register([Batch, AlumniProfile, ContactInfo, Employment, EngagementPreference, ConsentRecord, GalleryImage])
