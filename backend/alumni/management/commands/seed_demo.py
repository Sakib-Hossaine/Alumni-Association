from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.utils import timezone
from datetime import timedelta
from decimal import Decimal
from alumni.models import Batch, AlumniProfile
from events.models import Event
from donations.models import Donation

class Command(BaseCommand):
    help = "Create a local demo dataset. Configure passwords with SEED_ADMIN_PASSWORD and SEED_DEMO_PASSWORD."
    def handle(self, *args, **options):
        User = get_user_model()
        admin, _ = User.objects.get_or_create(email="admin@example.com", defaults={"username": "admin", "role": "ADMIN", "is_staff": True, "is_superuser": True})
        if not admin.has_usable_password(): admin.set_password(__import__("os").getenv("SEED_ADMIN_PASSWORD", "ChangeMe123!")); admin.save()
        manager, _ = User.objects.get_or_create(email="management@example.com", defaults={"username": "management", "role": "MANAGEMENT"})
        if not manager.has_usable_password(): manager.set_password(__import__("os").getenv("SEED_DEMO_PASSWORD", "ChangeMe123!")); manager.save()
        batches = [Batch.objects.get_or_create(number=f"CS-{year}", defaults={"year": year, "created_by": admin})[0] for year in range(2022, 2025)]
        for i in range(1, 6):
            user, _ = User.objects.get_or_create(email=f"alumni{i}@example.com", defaults={"username": f"alumni{i}", "role": "ALUMNI"})
            if not user.has_usable_password(): user.set_password(__import__("os").getenv("SEED_DEMO_PASSWORD", "ChangeMe123!")); user.save()
            AlumniProfile.objects.get_or_create(user=user, defaults={"student_id": f"CS-AL-{i:03}", "full_name": f"Demo Alumni {i}", "gender": "OTHER", "graduation_year": 2020+i, "batch": batches[(i-1)%3]})
        Event.objects.get_or_create(title="Annual Alumni Reunion", defaults={"event_type": "REUNION", "event_date": timezone.now()+timedelta(days=30), "venue": "University Auditorium", "description": "Reconnect with classmates and faculty.", "is_published": True, "created_by": manager})
        Event.objects.get_or_create(title="Career Networking Evening", defaults={"event_type": "NETWORKING", "event_date": timezone.now()+timedelta(days=45), "venue": "Innovation Center", "description": "Meet alumni and explore new opportunities.", "is_published": True, "created_by": manager})
        for i, profile in enumerate(AlumniProfile.objects.order_by("student_id"), start=1):
            Donation.objects.get_or_create(transaction_id=f"DEMO-GIFT-{i:03}", defaults={"alumni": profile, "amount": Decimal("1000.00")*i, "donation_date": timezone.localdate()-timedelta(days=20*i), "purpose": "Alumni scholarship fund", "payment_method": "BANK", "recorded_by": manager})
        self.stdout.write(self.style.SUCCESS("Demo data created. Change demo passwords before deployment."))
