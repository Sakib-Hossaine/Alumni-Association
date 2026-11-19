$ErrorActionPreference = 'Stop'
Set-Location -LiteralPath $PSScriptRoot

if (-not (Test-Path -LiteralPath '.\node_modules\.bin\vite.cmd')) {
    Write-Host 'Frontend dependencies are missing. Run npm install in the frontend folder first.' -ForegroundColor Red
    exit 1
}

& .\node_modules\.bin\vite.cmd --host 127.0.0.1 --port 5173 --strictPort
