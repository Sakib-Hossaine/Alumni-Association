from django.contrib.auth import authenticate
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.parsers import JSONParser, MultiPartParser, FormParser
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from .models import CustomUser
from .permissions import IsAdminRole
from .serializers import UserSerializer, LoginSerializer

class LoginView(APIView):
    permission_classes = [AllowAny]
    def post(self, request):
        data = LoginSerializer(data=request.data); data.is_valid(raise_exception=True)
        user = authenticate(request, username=data.validated_data["email"], password=data.validated_data["password"])
        if not user: return Response({"detail": "Invalid email or password."}, status=status.HTTP_401_UNAUTHORIZED)
        token = RefreshToken.for_user(user)
        return Response({"access": str(token.access_token), "refresh": str(token), "user": UserSerializer(user, context={"request": request}).data})
class UserViewSet(viewsets.ModelViewSet):
    queryset = CustomUser.objects.all().order_by("email")
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated, IsAdminRole]
    def perform_create(self, serializer): serializer.save()
    @action(detail=False, methods=["get", "patch"], permission_classes=[IsAuthenticated], parser_classes=[JSONParser, MultiPartParser, FormParser], url_path="me")
    def me(self, request):
        if request.method == "GET": return Response(UserSerializer(request.user, context=self.get_serializer_context()).data)
        serializer = UserSerializer(request.user, data=request.data, partial=True, context=self.get_serializer_context())
        serializer.is_valid(raise_exception=True)
        # A self-service profile endpoint only allows profile photo changes.
        if set(request.data.keys()) - {"profile_photo"}:
            return Response({"detail": "Only profile_photo can be changed here."}, status=400)
        serializer.save()
        return Response(serializer.data)
    @action(detail=True, methods=["patch"], url_path="role-change")
    def role_change(self, request, pk=None):
        user = self.get_object(); role = request.data.get("role")
        if role not in CustomUser.Role.values: return Response({"role": "Invalid role."}, status=400)
        user.role = role; user.save(update_fields=["role"]); return Response(self.get_serializer(user).data)
