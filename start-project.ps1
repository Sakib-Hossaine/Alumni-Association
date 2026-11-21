$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$backendPath = Join-Path $projectRoot 'backend'
$frontendPath = Join-Path $projectRoot 'frontend'

function Test-Ipv4Port {
    param([Parameter(Mandatory)][int]$Port)

    $client = [System.Net.Sockets.TcpClient]::new()
    try {
        $connect = $client.ConnectAsync([System.Net.IPAddress]::Loopback, $Port)
        return $connect.Wait(750) -and $client.Connected
    } catch {
        return $false
    } finally {
        $client.Dispose()
    }
}

function Test-HttpEndpoint {
    param([Parameter(Mandatory)][string]$Url)

    try {
        $response = Invoke-WebRequest -Uri $Url -Method Get -TimeoutSec 2 -UseBasicParsing
        return $response.StatusCode -eq 200
    } catch {
        return $false
    }
}

function Start-ProjectTerminal {
    param(
        [Parameter(Mandatory)][string]$WorkingDirectory,
        [Parameter(Mandatory)][string]$ScriptPath
    )

    $shellName = if ($PSVersionTable.PSEdition -eq 'Core') { 'pwsh.exe' } else { 'powershell.exe' }
    $powershellExe = Join-Path $PSHOME $shellName
    $quotedScript = '"{0}"' -f $ScriptPath
    Start-Process -FilePath $powershellExe `
        -WorkingDirectory $WorkingDirectory `
        -ArgumentList @('-NoExit', '-ExecutionPolicy', 'Bypass', '-File', $quotedScript) `
        -PassThru
}

if (-not (Test-HttpEndpoint -Url 'http://127.0.0.1:8001/api/v1/health/')) {
    if (Test-Ipv4Port -Port 8001) {
        Write-Host 'Port 8001 is occupied, but the Alumni API health check failed. Close the stale process and run this launcher again.' -ForegroundColor Red
        exit 1
    }
    $backendProcess = Start-ProjectTerminal -WorkingDirectory $backendPath -ScriptPath (Join-Path $backendPath 'start-backend.ps1')
    Write-Host 'Started Django in a new PowerShell window.'
    $backendDeadline = (Get-Date).AddSeconds(60)
    while ((Get-Date) -lt $backendDeadline -and -not (Test-HttpEndpoint -Url 'http://127.0.0.1:8001/api/v1/health/')) {
        if ($backendProcess.HasExited) {
            Write-Host "Django stopped during startup (exit code $($backendProcess.ExitCode)). Read the backend window, fix the shown error, then run this launcher again." -ForegroundColor Red
            exit 1
        }
        Start-Sleep -Seconds 1
    }
    if (-not (Test-HttpEndpoint -Url 'http://127.0.0.1:8001/api/v1/health/')) {
        Write-Host 'Django did not become ready within 60 seconds. Read the backend window for the startup error.' -ForegroundColor Red
        exit 1
    }
}
Write-Host 'Django API and database are ready at http://127.0.0.1:8001'

if (-not (Test-HttpEndpoint -Url 'http://127.0.0.1:5173/login')) {
    if (Test-Ipv4Port -Port 5173) {
        Write-Host 'Port 5173 is occupied, but the Alumni frontend did not respond. Close the stale process and run this launcher again.' -ForegroundColor Red
        exit 1
    }
    $frontendProcess = Start-ProjectTerminal -WorkingDirectory $frontendPath -ScriptPath (Join-Path $frontendPath 'start-frontend.ps1')
    Write-Host 'Started Vite in a new PowerShell window.'
    $frontendDeadline = (Get-Date).AddSeconds(45)
    while ((Get-Date) -lt $frontendDeadline -and -not (Test-HttpEndpoint -Url 'http://127.0.0.1:5173/login')) {
        if ($frontendProcess.HasExited) {
            Write-Host "Vite stopped during startup (exit code $($frontendProcess.ExitCode)). Read the frontend window, fix the shown error, then run this launcher again." -ForegroundColor Red
            exit 1
        }
        Start-Sleep -Seconds 1
    }
    if (-not (Test-HttpEndpoint -Url 'http://127.0.0.1:5173/login')) {
        Write-Host 'Vite did not become ready within 45 seconds. Read the frontend window for the startup error.' -ForegroundColor Red
        exit 1
    }
}
Write-Host 'Frontend is ready at http://127.0.0.1:5173'

Write-Host 'Both services are ready. Sign in at http://127.0.0.1:5173/login.'
