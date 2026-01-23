# Script de demarrage - Plateforme Suivi PAM MHA

Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "  Demarrage Suivi PAM - MHA" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""

# 1. Creer le fichier .env
Write-Host "[1/4] Creation du fichier .env..." -ForegroundColor Yellow

$envContent = @"
PORT=3000
NODE_ENV=development
PUBLIC_URL=http://localhost:3000

DB_HOST=localhost
DB_PORT=5432
DB_NAME=suivi_pam_mha
DB_USER=postgres
DB_PASSWORD=bonea2024

JWT_SECRET=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6
JWT_EXPIRATION=24h

EXTERNAL_API_KEY=mha2026-api-key-externe
CORS_ALLOWED_ORIGINS=http://localhost:3000
"@

$envPath = Join-Path $PSScriptRoot ".env"
Set-Content -Path $envPath -Value $envContent -Encoding UTF8
Write-Host "  OK Fichier .env cree" -ForegroundColor Green
Write-Host ""

# 2. Installer les dependances
Write-Host "[2/4] Installation des dependances..." -ForegroundColor Yellow

if (-not (Test-Path "node_modules")) {
    Write-Host "  Installation en cours..." -ForegroundColor Cyan
    npm install
    Write-Host "  OK Dependances installees" -ForegroundColor Green
} else {
    Write-Host "  OK Dependances deja installees" -ForegroundColor Green
}
Write-Host ""

# 3. Liberer le port 3000
Write-Host "[3/4] Verification du port 3000..." -ForegroundColor Yellow

$portInUse = Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue

if ($portInUse) {
    Write-Host "  Liberation du port..." -ForegroundColor Cyan
    foreach ($processId in $portInUse.OwningProcess | Select-Object -Unique) {
        Stop-Process -Id $processId -Force -ErrorAction SilentlyContinue
    }
    Start-Sleep -Seconds 2
    Write-Host "  OK Port 3000 libere" -ForegroundColor Green
} else {
    Write-Host "  OK Port 3000 disponible" -ForegroundColor Green
}
Write-Host ""

# 4. Demarrage
Write-Host "[4/4] Demarrage de l application..." -ForegroundColor Yellow
Write-Host ""
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "  Application prete!" -ForegroundColor Green
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "URL:      http://localhost:3000/login.html" -ForegroundColor Green
Write-Host "Username: admin" -ForegroundColor White
Write-Host "Password: admin123" -ForegroundColor White
Write-Host ""
Write-Host "Appuyez sur Ctrl+C pour arreter" -ForegroundColor Gray
Write-Host ""

npm start

