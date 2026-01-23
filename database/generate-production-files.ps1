# ============================================================================
# Script PowerShell - Génération des fichiers de production
# MHA PAM 2026
# ============================================================================

Write-Host ""
Write-Host "╔══════════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║  Génération des fichiers de production - MHA PAM 2026           ║" -ForegroundColor Cyan
Write-Host "╚══════════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# Vérifier que Node.js est installé
Write-Host "🔍 Vérification de Node.js..." -ForegroundColor Yellow
try {
    $nodeVersion = node --version
    Write-Host "   ✅ Node.js version: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "   ❌ Erreur: Node.js n'est pas installé ou n'est pas dans le PATH" -ForegroundColor Red
    Write-Host "   Téléchargez Node.js depuis: https://nodejs.org" -ForegroundColor Yellow
    exit 1
}

# Vérifier que le fichier .env existe
Write-Host ""
Write-Host "🔍 Vérification du fichier .env..." -ForegroundColor Yellow
if (Test-Path ".env") {
    Write-Host "   ✅ Fichier .env trouvé" -ForegroundColor Green
} else {
    Write-Host "   ⚠️  Avertissement: Fichier .env non trouvé" -ForegroundColor Yellow
    Write-Host "   Le script utilisera les valeurs par défaut de la base de données" -ForegroundColor Yellow
}

# Vérifier que la base de données locale est accessible
Write-Host ""
Write-Host "🔍 Vérification de la connexion à la base de données..." -ForegroundColor Yellow
try {
    node test-db.js 2>&1 | Out-Null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "   ✅ Connexion à la base de données OK" -ForegroundColor Green
    } else {
        Write-Host "   ⚠️  Avertissement: Impossible de se connecter à la base de données" -ForegroundColor Yellow
        Write-Host "   Vérifiez que PostgreSQL est démarré et que les credentials sont corrects" -ForegroundColor Yellow
        $continue = Read-Host "   Voulez-vous continuer quand même? (o/N)"
        if ($continue -ne "o" -and $continue -ne "O") {
            Write-Host "   ❌ Opération annulée" -ForegroundColor Red
            exit 1
        }
    }
} catch {
    Write-Host "   ⚠️  Impossible de vérifier la connexion" -ForegroundColor Yellow
}

# Générer le fichier de seed
Write-Host ""
Write-Host "🔄 Génération du fichier de seed..." -ForegroundColor Yellow
Write-Host ""

try {
    node database/export_seed.js
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "═══════════════════════════════════════════════════════════════════" -ForegroundColor Green
        Write-Host "✅ Fichiers de production générés avec succès!" -ForegroundColor Green
        Write-Host "═══════════════════════════════════════════════════════════════════" -ForegroundColor Green
        Write-Host ""
        
        # Vérifier que les fichiers existent
        $schemaFile = "database\production_schema.sql"
        $seedFile = "database\production_seed.sql"
        
        if (Test-Path $schemaFile) {
            $schemaSize = (Get-Item $schemaFile).Length
            Write-Host "📄 $schemaFile" -ForegroundColor Cyan
            Write-Host "   Taille: $([math]::Round($schemaSize/1KB, 2)) KB" -ForegroundColor Gray
        }
        
        if (Test-Path $seedFile) {
            $seedSize = (Get-Item $seedFile).Length
            Write-Host "📄 $seedFile" -ForegroundColor Cyan
            Write-Host "   Taille: $([math]::Round($seedSize/1KB, 2)) KB" -ForegroundColor Gray
        }
        
        Write-Host ""
        Write-Host "📋 Prochaines étapes:" -ForegroundColor Yellow
        Write-Host "   1. Copiez ces 2 fichiers vers votre serveur de production" -ForegroundColor White
        Write-Host "   2. Exécutez production_schema.sql sur la base de production" -ForegroundColor White
        Write-Host "   3. Exécutez production_seed.sql sur la base de production" -ForegroundColor White
        Write-Host ""
        Write-Host "📖 Documentation complète:" -ForegroundColor Yellow
        Write-Host "   - database\DEPLOY_PRODUCTION.md (guide détaillé)" -ForegroundColor White
        Write-Host "   - database\README_PRODUCTION.md (vue d'ensemble)" -ForegroundColor White
        Write-Host ""
        
        # Ouvrir le dossier dans l'explorateur
        $openFolder = Read-Host "Voulez-vous ouvrir le dossier database dans l'explorateur? (O/n)"
        if ($openFolder -ne "n" -and $openFolder -ne "N") {
            Start-Process explorer.exe (Resolve-Path "database")
        }
        
    } else {
        Write-Host ""
        Write-Host "❌ Erreur lors de la génération du fichier de seed" -ForegroundColor Red
        Write-Host "   Vérifiez les logs ci-dessus pour plus de détails" -ForegroundColor Yellow
        exit 1
    }
    
} catch {
    Write-Host ""
    Write-Host "❌ Erreur inattendue: $_" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "Script terminé" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

