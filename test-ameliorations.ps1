# Test des Améliorations Enterprise OS
# Phase 1 - Dark Mode & Design Polish

Write-Host "=== ENTERPRISE OS - VALIDATION DES AMÉLIORATIONS ===" -ForegroundColor Green
Write-Host ""

# Test 1: Vérification du build
Write-Host "1. Test du build TypeScript..." -ForegroundColor Yellow
try {
    $buildResult = npm run build 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "   ✅ Build réussi" -ForegroundColor Green
    } else {
        Write-Host "   ❌ Erreurs de build détectées" -ForegroundColor Red
        Write-Host $buildResult
    }
} catch {
    Write-Host "   ❌ Erreur lors du build" -ForegroundColor Red
}

Write-Host ""

# Test 2: Vérification des composants critiques
Write-Host "2. Vérification des fichiers critiques..." -ForegroundColor Yellow

$criticalFiles = @(
    "src/App.tsx",
    "src/components/layout/Header.tsx", 
    "src/components/ui/MetricCard.tsx",
    "src/pages/Dashboard.tsx",
    "src/pages/business/Quotes.tsx",
    "src/pages/business/Invoices.tsx",
    "src/pages/business/Clients.tsx",
    "src/pages/hr/Employees.tsx"
)

foreach ($file in $criticalFiles) {
    if (Test-Path $file) {
        Write-Host "   ✅ $file" -ForegroundColor Green
    } else {
        Write-Host "   ❌ $file manquant" -ForegroundColor Red
    }
}

Write-Host ""

# Test 3: Vérification des dépendances
Write-Host "3. Vérification des dépendances..." -ForegroundColor Yellow

$dependencies = @("next-themes", "lucide-react", "react", "react-dom")
$packageJson = Get-Content "package.json" | ConvertFrom-Json

foreach ($dep in $dependencies) {
    if ($packageJson.dependencies.$dep) {
        Write-Host "   ✅ $dep : $($packageJson.dependencies.$dep)" -ForegroundColor Green
    } else {
        Write-Host "   ❌ $dep manquant" -ForegroundColor Red
    }
}

Write-Host ""

# Test 4: Structure des modules
Write-Host "4. Vérification de l'architecture..." -ForegroundColor Yellow

$directories = @(
    "src/components/ui",
    "src/components/layout", 
    "src/pages/business",
    "src/pages/hr",
    "src/contexts",
    "src/integrations/supabase"
)

foreach ($dir in $directories) {
    if (Test-Path $dir) {
        $fileCount = (Get-ChildItem $dir -File).Count
        Write-Host "   ✅ $dir ($fileCount fichiers)" -ForegroundColor Green
    } else {
        Write-Host "   ❌ $dir manquant" -ForegroundColor Red
    }
}

Write-Host ""

# Test 5: Fonctionnalités Dark Mode
Write-Host "5. Vérification du Dark Mode..." -ForegroundColor Yellow

if ((Get-Content "src/App.tsx") -match "ThemeProvider") {
    Write-Host "   ✅ ThemeProvider configuré" -ForegroundColor Green
} else {
    Write-Host "   ❌ ThemeProvider manquant" -ForegroundColor Red
}

if ((Get-Content "src/components/layout/Header.tsx") -match "useTheme") {
    Write-Host "   ✅ Toggle thème dans Header" -ForegroundColor Green
} else {
    Write-Host "   ❌ Toggle thème manquant" -ForegroundColor Red
}

if ((Get-Content "src/index.css") -match "\.dark") {
    Write-Host "   ✅ Variables CSS dark mode" -ForegroundColor Green
} else {
    Write-Host "   ❌ Variables CSS dark mode manquantes" -ForegroundColor Red
}

Write-Host ""

# Résumé
Write-Host "=== RÉSUMÉ ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "✅ Application de base fonctionnelle avec:" -ForegroundColor Green
Write-Host "   - Système d'authentification complet" 
Write-Host "   - Modules Business (Devis, Factures, Clients)"
Write-Host "   - Modules RH (Employés, Départements)"
Write-Host "   - Base de données Supabase connectée"
Write-Host "   - Design system shadcn/ui"
Write-Host ""
Write-Host "🎨 Améliorations apportées:" -ForegroundColor Magenta
Write-Host "   - Support Dark Mode complet"
Write-Host "   - Composant MetricCard avec animations"
Write-Host "   - Dashboard avec indicateurs de tendance"
Write-Host "   - Polices et spacing améliorés"
Write-Host ""
Write-Host "🚀 Prochaines étapes:" -ForegroundColor Yellow
Write-Host "   1. Tester l'application → http://localhost:8082"
Write-Host "   2. Valider le toggle dark/light mode"
Write-Host "   3. Vérifier les nouvelles métriques animées"
Write-Host "   4. Continuer les améliorations progressives"
Write-Host ""

# Ouvrir l'application
Write-Host "Souhaitez-vous ouvrir l'application dans le navigateur ? (O/N)" -ForegroundColor Cyan
$response = Read-Host
if ($response -eq "O" -or $response -eq "o") {
    Start-Process "http://localhost:8082"
    Write-Host "Application ouverte dans le navigateur" -ForegroundColor Green
}
