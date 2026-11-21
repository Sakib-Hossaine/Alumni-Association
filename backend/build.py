import os
import subprocess
import sys


required_settings = {
    "DJANGO_SECRET_KEY": os.getenv("DJANGO_SECRET_KEY") or os.getenv("SECRET_KEY"),
    "DATABASE_URL": os.getenv("DATABASE_URL"),
}
missing = [name for name, value in required_settings.items() if not value]
if missing:
    raise SystemExit(
        "Vercel backend build needs these Project Environment Variables: "
        + ", ".join(missing)
    )

subprocess.run(
    [sys.executable, "manage.py", "migrate", "--noinput"],
    check=True,
)
