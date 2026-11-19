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

function Start-ProjectTerminal {
    param(
        [Parameter(Mandatory)][string]$WorkingDirectory,
        [Parameter(Mandatory)][string]$ScriptPath
    )

    $powershellExe = Join-Path $PSHOME 'powershell.exe'
    $quotedScript = '"{0}"' -f $ScriptPath
    Start-Process -FilePath $powershellExe `
        -WorkingDirectory $WorkingDirectory `
        -ArgumentList @('-NoExit', '-ExecutionPolicy', 'Bypass', '-File', $quotedScript) | Out-Null
}

if (Test-Ipv4Port -Port 8001) {
    Write-Host 'Django is already available at http://127.0.0.1:8001'
} else {
    Start-ProjectTerminal -WorkingDirectory $backendPath -ScriptPath (Join-Path $backendPath 'start-backend.ps1')
    Write-Host 'Started Django in a new PowerShell window.'
}

if (Test-Ipv4Port -Port 5173) {
    Write-Host 'Vite is already available at http://127.0.0.1:5173'
} else {
    Start-ProjectTerminal -WorkingDirectory $frontendPath -ScriptPath (Join-Path $frontendPath 'start-frontend.ps1')
    Write-Host 'Started Vite in a new PowerShell window.'
}

Write-Host 'Open http://127.0.0.1:5173 after the two server windows report ready.'
