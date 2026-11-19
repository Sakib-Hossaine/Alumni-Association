$ErrorActionPreference = 'Stop'
Set-Location -LiteralPath $PSScriptRoot

if (-not (Get-Command python -ErrorAction SilentlyContinue)) {
    Write-Host 'Python was not found. Install Python 3.10+ and add it to PATH.' -ForegroundColor Red
    exit 1
}

$pythonExe = (Get-Command python).Source
& $pythonExe -c "import django, rest_framework, rest_framework_simplejwt, django_filters, corsheaders, psycopg, PIL, decouple" 2>$null
if ($LASTEXITCODE -ne 0 -and (Test-Path -LiteralPath '.\.venv\Scripts\python.exe')) {
    # Use the installed project dependencies without requiring environment activation.
    $pythonExe = (Resolve-Path -LiteralPath '.\.venv\Scripts\python.exe').Path
    & $pythonExe -c "import django, rest_framework, rest_framework_simplejwt, django_filters, corsheaders, psycopg, PIL, decouple" 2>$null
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

& $pythonExe manage.py runserver 127.0.0.1:8001
