# ======================================================
# Script d'arrêt - Plateforme Suivi PAM MHA
# ======================================================

Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "  Arrêt Suivi PAM - MHA" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""

# Rechercher les processus Node.js utilisant le port 3000
$portInUse = Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue

if ($portInUse) {
    Write-Host "Processus trouvés sur le port 3000:" -ForegroundColor Yellow
    
    foreach ($pid in $portInUse.OwningProcess | Select-Object -Unique) {
        $process = Get-Process -Id $pid -ErrorAction SilentlyContinue
        if ($process) {
            Write-Host "  PID: $pid - $($process.ProcessName)" -ForegroundColor White
        }
    }
    
    Write-Host ""
    $response = Read-Host "Voulez-vous arrêter ces processus? (O/N)"
    
    if ($response -eq "O" -or $response -eq "o") {
        foreach ($pid in $portInUse.OwningProcess | Select-Object -Unique) {
            try {
                Stop-Process -Id $pid -Force
                Write-Host "  ✓ Processus $pid arrêté" -ForegroundColor Green
            } catch {
                Write-Host "  ✗ Impossible d'arrêter le processus $pid" -ForegroundColor Red
            }
        }
        Write-Host ""
        Write-Host "Serveur arrêté avec succès!" -ForegroundColor Green
    } else {
        Write-Host "Annulation." -ForegroundColor Yellow
    }
} else {
    Write-Host "Aucun processus n'utilise le port 3000." -ForegroundColor Green
}

Write-Host ""

