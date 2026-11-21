$ErrorActionPreference = 'Stop'
Set-Location -LiteralPath $PSScriptRoot

if (-not (Get-Command python -ErrorAction SilentlyContinue)) {
    Write-Host 'Python was not found. Install Python 3.10+ and add it to PATH.' -ForegroundColor Red
    exit 1
}

$pythonExe = (Get-Command python).Source
$dependencyCheck = "import importlib.util, sys; packages = ['django', 'rest_framework', 'rest_framework_simplejwt', 'django_filters', 'corsheaders', 'psycopg', 'PIL', 'decouple']; sys.exit(0 if all(importlib.util.find_spec(package) for package in packages) else 1)"
& $pythonExe -c $dependencyCheck 2>$null
if ($LASTEXITCODE -ne 0 -and (Test-Path -LiteralPath '.\.venv\Scripts\python.exe')) {
    # Use the installed project dependencies without requiring environment activation.
    $pythonExe = (Resolve-Path -LiteralPath '.\.venv\Scripts\python.exe').Path
    & $pythonExe -c $dependencyCheck 2>$null
}
if ($LASTEXITCODE -ne 0) {
    Write-Host 'Backend dependencies are missing. Install them with: python -m pip install -r requirements.txt' -ForegroundColor Red
    exit 1
}

& $pythonExe manage.py migrate
if ($LASTEXITCODE -ne 0) {
    Write-Host 'Database migration failed; Django was not started.' -ForegroundColor Red
    exit $LASTEXITCODE
}

$adminExists = & $pythonExe manage.py shell --no-startup -c "from django.contrib.auth import get_user_model; print(get_user_model().objects.filter(email='admin@example.com').exists())"
if ($LASTEXITCODE -eq 0 -and (($adminExists | Out-String).Trim() -eq 'False')) {
    & $pythonExe manage.py seed_demo
    if ($LASTEXITCODE -ne 0) {
        Write-Host 'Demo account setup failed; Django was not started.' -ForegroundColor Red
        exit $LASTEXITCODE
    }
    Write-Host 'Local demo login: admin@example.com / ChangeMe123!' -ForegroundColor Yellow
}

& $pythonExe manage.py runserver 127.0.0.1:8001
