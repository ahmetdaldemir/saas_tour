# Otomatik Build Script
# Bu script dosya değişikliklerini izler ve otomatik olarak Docker build yapar

param(
    [switch]$Watch = $false
)

$composeFile = Join-Path $PSScriptRoot "infra\docker-compose.yml"

function Build-Docker {
    Write-Host "`n[$(Get-Date -Format 'HH:mm:ss')] 🔨 Building Docker containers..." -ForegroundColor Cyan
    Push-Location $PSScriptRoot
    try {
        docker-compose -f $composeFile up -d --build 2>&1 | Out-Null
        if ($LASTEXITCODE -eq 0) {
            Write-Host "[$(Get-Date -Format 'HH:mm:ss')] ✅ Build başarılı!" -ForegroundColor Green
        } else {
            Write-Host "[$(Get-Date -Format 'HH:mm:ss')] ❌ Build başarısız!" -ForegroundColor Red
        }
    } finally {
        Pop-Location
    }
}

if ($Watch) {
    Write-Host "👀 Watch modu aktif - Dosya değişikliklerini izliyorum..." -ForegroundColor Yellow
    Write-Host "Çıkmak için Ctrl+C basın`n" -ForegroundColor Gray
    
    # İzlenecek klasörler
    $watchPaths = @(
        "backend\src",
        "frontend\src"
    )
    
    # İlk build
    Build-Docker
    
    # FileSystemWatcher oluştur
    $watchers = @()
    foreach ($path in $watchPaths) {
        $fullPath = Join-Path $PSScriptRoot $path
        if (Test-Path $fullPath) {
            $watcher = New-Object System.IO.FileSystemWatcher
            $watcher.Path = $fullPath
            $watcher.IncludeSubdirectories = $true
            $watcher.Filter = "*.*"
            $watcher.NotifyFilter = [System.IO.NotifyFilters]::LastWrite -bor [System.IO.NotifyFilters]::FileName
            
            $action = {
                $file = $Event.SourceEventArgs.Name
                $changeType = $Event.SourceEventArgs.ChangeType
                Write-Host "[$(Get-Date -Format 'HH:mm:ss')] 📝 Değişiklik: $file ($changeType)" -ForegroundColor Magenta
                
                # Debounce: 2 saniye bekle
                Start-Sleep -Seconds 2
                Build-Docker
            }
            
            Register-ObjectEvent -InputObject $watcher -EventName "Changed" -Action $action | Out-Null
            Register-ObjectEvent -InputObject $watcher -EventName "Created" -Action $action | Out-Null
            Register-ObjectEvent -InputObject $watcher -EventName "Deleted" -Action $action | Out-Null
            Register-ObjectEvent -InputObject $watcher -EventName "Renamed" -Action $action | Out-Null
            
            $watcher.EnableRaisingEvents = $true
            $watchers += $watcher
            
            Write-Host "  ✓ İzleniyor: $path" -ForegroundColor Gray
        }
    }
    
    # Ctrl+C ile çıkış
    try {
        while ($true) {
            Start-Sleep -Seconds 1
        }
    } finally {
        foreach ($watcher in $watchers) {
            $watcher.EnableRaisingEvents = $false
            $watcher.Dispose()
        }
        Write-Host "`n👋 Watch modu kapatıldı" -ForegroundColor Yellow
    }
} else {
    # Tek seferlik build
    Build-Docker
}

