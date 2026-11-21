from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import Batch, AlumniProfile, ContactInfo, Employment, EngagementPreference, ConsentRecord, GalleryImage

class GalleryImageSerializer(serializers.ModelSerializer):
    uploaded_by_name = serializers.SerializerMethodField()
    class Meta:
        model = GalleryImage
        fields = ["id", "image", "caption", "uploaded_by_name", "created_at"]
        read_only_fields = ["id", "uploaded_by_name", "created_at"]
    def get_uploaded_by_name(self, obj):
        return obj.uploaded_by.get_full_name() or obj.uploaded_by.username if obj.uploaded_by else "Alumni office"

class BatchSerializer(serializers.ModelSerializer):
    class Meta: model = Batch; fields = ["id", "number", "year", "description", "is_active", "created_at", "created_by"]; read_only_fields = ["id", "created_at", "created_by"]

class DirectorySerializer(serializers.ModelSerializer):
    batch = BatchSerializer(read_only=True, allow_null=True)
    company_name = serializers.SerializerMethodField()
    profile_photo = serializers.SerializerMethodField()
    class Meta:
        model = AlumniProfile
        fields = ["id", "student_id", "full_name", "graduation_year", "major", "batch", "profile_photo", "company_name"]
    def get_company_name(self, obj):
        job = next((e for e in obj.employments.all() if e.is_current), None)
        job = job or next(iter(obj.employments.all()), None)
        return job.company_name if job else ""
    def get_profile_photo(self, obj):
        photo = getattr(obj.user, "profile_photo", None) or obj.profile_photo
        return photo.url if photo else None
class ContactSerializer(serializers.ModelSerializer):
    class Meta: model = ContactInfo; exclude = ["profile"]
class EmploymentSerializer(serializers.ModelSerializer):
    class Meta: model = Employment; exclude = ["profile"]
class EngagementSerializer(serializers.ModelSerializer):
    class Meta: model = EngagementPreference; exclude = ["profile"]
class ConsentSerializer(serializers.ModelSerializer):
    class Meta: model = ConsentRecord; exclude = ["profile"]
class AlumniReadSerializer(serializers.ModelSerializer):
    batch = BatchSerializer(read_only=True, allow_null=True); contact = ContactSerializer(read_only=True, allow_null=True); employments = EmploymentSerializer(many=True, read_only=True); engagement_preference = EngagementSerializer(read_only=True, allow_null=True); consent = ConsentSerializer(read_only=True, allow_null=True)
    major = serializers.ReadOnlyField()
    profile_photo = serializers.SerializerMethodField()
    class Meta: model = AlumniProfile; fields = "__all__"
    def get_profile_photo(self, obj):
        photo = getattr(obj.user, "profile_photo", None) or obj.profile_photo
        if not photo: return None
        return photo.url
class AlumniWriteSerializer(serializers.ModelSerializer):
    batch_id = serializers.PrimaryKeyRelatedField(source="batch", queryset=Batch.objects.filter(is_active=True), required=False, allow_null=True)
    email = serializers.EmailField(write_only=True, required=False)
    password = serializers.CharField(write_only=True, required=False, min_length=8)
    user_id = serializers.PrimaryKeyRelatedField(source="user", queryset=get_user_model().objects.all(), write_only=True, required=False)
    contact = ContactSerializer(required=False, allow_null=True)
    employments = EmploymentSerializer(many=True, required=False)
    engagement_preference = EngagementSerializer(required=False, allow_null=True)
    consent = ConsentSerializer(required=False, allow_null=True)
    class Meta:
        model = AlumniProfile
        fields = ["id", "user_id", "email", "password", "student_id", "full_name", "preferred_name", "gender", "date_of_birth", "nationality", "profile_photo", "graduation_year", "batch_id", "bio", "contact", "employments", "engagement_preference", "consent", "created_at", "updated_at"]
        read_only_fields = ["id", "created_at", "updated_at"]
    def validate(self, attrs):
        if self.instance is None and not attrs.get("user") and not attrs.get("email"):
            raise serializers.ValidationError({"email": "Provide an email to create the alumni account, or an existing user_id."})
        if self.instance and "email" in attrs: attrs.pop("email")
        if self.instance:
            attrs.pop("user", None)
            attrs.pop("password", None)
        return attrs
    def _save_nested(self, profile, contact, employments, engagement, consent):
        if contact is not None: ContactInfo.objects.update_or_create(profile=profile, defaults=contact)
        if engagement is not None: EngagementPreference.objects.update_or_create(profile=profile, defaults=engagement)
        if consent is not None: ConsentRecord.objects.update_or_create(profile=profile, defaults=consent)
        if employments is not None:
            profile.employments.all().delete()
            Employment.objects.bulk_create([Employment(profile=profile, **item) for item in employments])
    def create(self, validated_data):
        email = validated_data.pop("email", None)
        password = validated_data.pop("password", None)
        contact = validated_data.pop("contact", None)
        employments = validated_data.pop("employments", None)
        engagement = validated_data.pop("engagement_preference", None)
        consent = validated_data.pop("consent", None)
        if email and not validated_data.get("user"):
            User = get_user_model()
            if User.objects.filter(email=email).exists():
                raise serializers.ValidationError({"email": "An account with this email already exists; use its user_id."})
            user = User.objects.create_user(username=email, email=email, role="ALUMNI")
            if password: user.set_password(password)
            else: user.set_unusable_password()
            user.save(update_fields=["password"])
            validated_data["user"] = user
        profile = super().create(validated_data)
        self._save_nested(profile, contact, employments, engagement, consent)
        return profile
    def update(self, instance, validated_data):
        contact = validated_data.pop("contact", None)
        employments = validated_data.pop("employments", None)
        engagement = validated_data.pop("engagement_preference", None)
        consent = validated_data.pop("consent", None)
        validated_data.pop("email", None); validated_data.pop("password", None)
        profile = super().update(instance, validated_data)
        self._save_nested(profile, contact, employments, engagement, consent)
        return profile
