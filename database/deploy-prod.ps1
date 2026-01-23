# ============================================================================
# Script de déploiement en production - MHA PAM 2026 (Windows PowerShell)
# ============================================================================

$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "🚀 Déploiement de la base de données de production" -ForegroundColor Cyan
Write-Host ""

# Configuration (modifiez selon votre environnement)
$DB_NAME = if ($env:DB_NAME) { $env:DB_NAME } else { "mha_pam_production" }
$DB_USER = if ($env:DB_USER) { $env:DB_USER } else { "postgres" }
$DB_HOST = if ($env:DB_HOST) { $env:DB_HOST } else { "localhost" }
$DB_PORT = if ($env:DB_PORT) { $env:DB_PORT } else { "5432" }

Write-Host "📦 Configuration:" -ForegroundColor Yellow
Write-Host "   - Base de données : $DB_NAME"
Write-Host "   - Utilisateur     : $DB_USER"
Write-Host "   - Hôte            : $DB_HOST"
Write-Host "   - Port            : $DB_PORT"
Write-Host ""

# Trouver psql
$psqlPath = $null
$possiblePaths = @(
    "C:\Program Files\PostgreSQL\*\bin\psql.exe",
    "C:\Program Files (x86)\PostgreSQL\*\bin\psql.exe"
)

foreach ($pattern in $possiblePaths) {
    $found = Get-ChildItem -Path $pattern -ErrorAction SilentlyContinue | Select-Object -First 1
    if ($found) {
        $psqlPath = $found.FullName
        break
    }
}

if (-not $psqlPath) {
    # Essayer la commande directe
    try {
        $null = Get-Command psql -ErrorAction Stop
        $psqlPath = "psql"
    } catch {
        Write-Host "❌ Erreur: psql introuvable" -ForegroundColor Red
        Write-Host "   Installez PostgreSQL ou ajoutez-le au PATH" -ForegroundColor Yellow
        exit 1
    }
}

Write-Host "🔍 Utilisation de: $psqlPath" -ForegroundColor Gray
Write-Host ""

# Fonction pour exécuter psql
function Invoke-Psql {
    param(
        [string]$Database,
        [string]$Command,
        [string]$File,
        [switch]$TupleOnly
    )
    
    $args = @(
        "-h", $DB_HOST,
        "-p", $DB_PORT,
        "-U", $DB_USER,
        "-d", $Database
    )
    
    if ($TupleOnly) { $args += "-tA" }
    if ($Command) { $args += @("-c", $Command) }
    if ($File) { $args += @("-f", $File) }
    
    & $psqlPath $args
    if ($LASTEXITCODE -ne 0) {
        throw "Erreur psql (code $LASTEXITCODE)"
    }
}

# Vérifier que PostgreSQL est accessible
Write-Host "🔍 Vérification de PostgreSQL..." -ForegroundColor Yellow
try {
    Invoke-Psql -Database "postgres" -Command "SELECT 1" | Out-Null
    Write-Host "   ✅ PostgreSQL accessible" -ForegroundColor Green
} catch {
    Write-Host "❌ Erreur: Impossible de se connecter à PostgreSQL" -ForegroundColor Red
    Write-Host "   Vérifiez que PostgreSQL est démarré et que les credentials sont corrects" -ForegroundColor Yellow
    exit 1
}
Write-Host ""

# Vérifier si la base existe déjà
Write-Host "🔍 Vérification de l'existence de la base..." -ForegroundColor Yellow
$dbExists = Invoke-Psql -Database "postgres" -Command "SELECT 1 FROM pg_database WHERE datname='$DB_NAME'" -TupleOnly

if ($dbExists -eq "1") {
    Write-Host "⚠️  La base $DB_NAME existe déjà!" -ForegroundColor Yellow
    $response = Read-Host "   Voulez-vous la supprimer et la recréer? (oui/non)"
    if ($response -eq "oui") {
        Write-Host "🗑️  Suppression de la base existante..." -ForegroundColor Yellow
        Invoke-Psql -Database "postgres" -Command "DROP DATABASE $DB_NAME;" | Out-Null
        Write-Host "   ✅ Base supprimée" -ForegroundColor Green
    } else {
        Write-Host "❌ Opération annulée" -ForegroundColor Red
        exit 0
    }
}

# Créer la base
Write-Host "📦 Création de la base de données..." -ForegroundColor Yellow
Invoke-Psql -Database "postgres" -Command "CREATE DATABASE $DB_NAME;" | Out-Null
Write-Host "   ✅ Base créée" -ForegroundColor Green
Write-Host ""

# Créer le schéma
Write-Host "📋 Création du schéma (tables, index, triggers)..." -ForegroundColor Yellow
if (-not (Test-Path "production_schema.sql")) {
    Write-Host "❌ Erreur: Fichier production_schema.sql introuvable!" -ForegroundColor Red
    exit 1
}
Invoke-Psql -Database $DB_NAME -File "production_schema.sql" | Out-Null
Write-Host "   ✅ Schéma créé" -ForegroundColor Green
Write-Host ""

# Importer les données
Write-Host "📊 Import des données..." -ForegroundColor Yellow
if (-not (Test-Path "production_seed.sql")) {
    Write-Host "❌ Erreur: Fichier production_seed.sql introuvable!" -ForegroundColor Red
    exit 1
}
Invoke-Psql -Database $DB_NAME -File "production_seed.sql" | Out-Null
Write-Host "   ✅ Données importées" -ForegroundColor Green
Write-Host ""

# Vérifier les données
Write-Host "🔍 Vérification des données..." -ForegroundColor Yellow
$countUsers = Invoke-Psql -Database $DB_NAME -Command "SELECT COUNT(*) FROM users" -TupleOnly
$countActions = Invoke-Psql -Database $DB_NAME -Command "SELECT COUNT(*) FROM actions" -TupleOnly

Write-Host "📊 Résumé:" -ForegroundColor Cyan
Write-Host "   - $countUsers utilisateur(s)"
Write-Host "   - $countActions action(s)"
Write-Host ""

Write-Host "✅ Déploiement terminé avec succès!" -ForegroundColor Green
Write-Host ""
Write-Host "⚠️  IMPORTANT: Changez le mot de passe admin immédiatement!" -ForegroundColor Yellow
Write-Host "   Login: admin / admin123" -ForegroundColor White
Write-Host ""

