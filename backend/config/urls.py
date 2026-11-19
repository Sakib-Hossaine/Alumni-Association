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
from django.conf.urls.static import static

router = DefaultRouter()
router.register("users", UserViewSet, basename="user")
router.register("batches", BatchViewSet, basename="batch")
router.register("alumni", AlumniViewSet, basename="alumni")
router.register("gallery", GalleryImageViewSet, basename="gallery")
router.register("events", EventViewSet, basename="event")
router.register("donations", DonationViewSet, basename="donation")
def home(request):
    return redirect(settings.FRONTEND_URL)

urlpatterns = [path("", home), path("admin/", admin.site.urls), path("api/v1/auth/login/", LoginView.as_view()), path("api/v1/auth/token/refresh/", TokenRefreshView.as_view()), path("api/v1/reports/analytics/", AnalyticsView.as_view()), path("api/v1/", include(router.urls))]
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
