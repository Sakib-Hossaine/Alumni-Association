from rest_framework import serializers
from .models import CustomUser

class UserSerializer(serializers.ModelSerializer):
    name = serializers.SerializerMethodField()
    class Meta:
        model = CustomUser
        fields = ["id", "email", "username", "password", "first_name", "last_name", "role", "phone", "profile_photo", "is_verified", "name", "created_at"]
        read_only_fields = ["id", "created_at", "is_verified"]
        extra_kwargs = {"password": {"write_only": True}}
    def get_name(self, obj): return obj.get_full_name() or obj.username
    def validate_phone(self, value): return value or None
    def create(self, validated_data):
        password = validated_data.pop("password")
        return CustomUser.objects.create_user(password=password, **validated_data)
    def update(self, instance, validated_data):
        password = validated_data.pop("password", None)
        instance = super().update(instance, validated_data)
        if password:
            instance.set_password(password)
            instance.save(update_fields=["password"])
        return instance
class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)

    def validate_email(self, value):
        return value.strip().lower()
