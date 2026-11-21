from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase


class LoginApiTests(APITestCase):
    def setUp(self):
        self.email = "login-test@example.com"
        self.password = "SecurePass123!"
        get_user_model().objects.create_user(
            username="login-test",
            email=self.email,
            password=self.password,
            role="ALUMNI",
        )

    def test_health_check_confirms_backend_and_database_are_ready(self):
        response = self.client.get("/api/v1/health/")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), {"status": "ok"})

    def test_login_returns_tokens_and_user(self):
        response = self.client.post(
            "/api/v1/auth/login/",
            {"email": self.email, "password": self.password},
            format="json",
        )

        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.data["access"])
        self.assertTrue(response.data["refresh"])
        self.assertEqual(response.data["user"]["email"], self.email)

    def test_login_normalizes_email_case(self):
        response = self.client.post(
            "/api/v1/auth/login/",
            {"email": self.email.upper(), "password": self.password},
            format="json",
        )

        self.assertEqual(response.status_code, 200)

    def test_login_rejects_wrong_password(self):
        response = self.client.post(
            "/api/v1/auth/login/",
            {"email": self.email, "password": "incorrect"},
            format="json",
        )

        self.assertEqual(response.status_code, 401)

    def test_django_superuser_gets_admin_application_role(self):
        admin = get_user_model().objects.create_superuser(
            username="first-admin",
            email="first-admin@example.com",
            password="SecurePass123!",
        )

        self.assertEqual(admin.role, "ADMIN")
