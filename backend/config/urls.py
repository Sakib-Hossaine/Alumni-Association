from django.contrib import admin
from django.urls import include, path
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView
from accounts.views import UserViewSet, LoginView
from alumni.views import BatchViewSet, AlumniViewSet, GalleryImageViewSet
from events.views import EventViewSet
from donations.views import DonationViewSet, AnalyticsView
from django.conf import settings
from django.shortcuts import redirect
from django.http import JsonResponse
from django.db import connection
from django.conf.urls.static import static
from django.http import Http404, HttpResponse
from urllib.parse import unquote


def serve_database_media(request, name):
    if getattr(settings, "STORAGES", {}).get("default", {}).get("BACKEND") != "config.storage.DatabaseMediaStorage":
        raise Http404
    from alumni.models import MediaAsset

    asset = MediaAsset.objects.filter(name=unquote(name)).first()
    if not asset:
        raise Http404
    import mimetypes
    content_type = mimetypes.guess_type(asset.name)[0] or "application/octet-stream"
    return HttpResponse(bytes(asset.content), content_type=content_type)

router = DefaultRouter()
router.register("users", UserViewSet, basename="user")
router.register("batches", BatchViewSet, basename="batch")
router.register("alumni", AlumniViewSet, basename="alumni")
router.register("gallery", GalleryImageViewSet, basename="gallery")
router.register("events", EventViewSet, basename="event")
router.register("donations", DonationViewSet, basename="donation")
def home(request):
    return redirect(settings.FRONTEND_URL)

def health(request):
    # Prove Django can reach its configured database before the frontend offers login.
    connection.ensure_connection()
    return JsonResponse({"status": "ok"})

urlpatterns = [path("", home), path("admin/", admin.site.urls), path("media/<path:name>", serve_database_media), path("api/v1/health/", health), path("api/v1/auth/login/", LoginView.as_view()), path("api/v1/auth/token/refresh/", TokenRefreshView.as_view()), path("api/v1/reports/analytics/", AnalyticsView.as_view()), path("api/v1/", include(router.urls))]
if settings.DEBUG or getattr(settings, "IS_VERCEL", False):
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
