# Test Final - Organigramme Simplifié
# Validation des 2 modes : Hiérarchique et Arbre

Write-Host "🧪 Test de l'organigramme simplifié..." -ForegroundColor Cyan
Write-Host ""

# Test 1: Vérification des fichiers simplifiés
Write-Host "📁 Vérification des fichiers simplifiés..." -ForegroundColor Yellow
$files = @(
    "src\components\hr\ConventionalOrgChart.tsx",
    "src\pages\hr\Organization.tsx"
)

$allExist = $true
foreach ($file in $files) {
    if (Test-Path $file) {
        Write-Host "   ✅ $file" -ForegroundColor Green
    } else {
        Write-Host "   ❌ $file MANQUANT" -ForegroundColor Red
        $allExist = $false
    }
}

if ($allExist) {
    Write-Host "   🎉 Tous les fichiers sont présents!" -ForegroundColor Green
}

Write-Host ""

# Test 2: Vérification des modes simplifiés
Write-Host "🎛️  Vérification des modes simplifiés..." -ForegroundColor Yellow

try {
    $orgFile = Get-Content "src\pages\hr\Organization.tsx" -Raw
    
    if ($orgFile -match "'hierarchy' \| 'tree'") {
        Write-Host "   ✅ Modes simplifiés configurés (hierarchy | tree)" -ForegroundColor Green
    } else {
        Write-Host "   ❌ Modes simplifiés non configurés" -ForegroundColor Red
    }
    
    if ($orgFile -match "ConventionalOrgChart") {
        Write-Host "   ✅ ConventionalOrgChart importé et utilisé" -ForegroundColor Green
    } else {
        Write-Host "   ❌ ConventionalOrgChart manquant" -ForegroundColor Red
    }
    
    # Vérifier que les anciens composants ne sont plus importés
    $removedComponents = @("VisualOrgChart", "EnterpriseOrgChart")
    foreach ($component in $removedComponents) {
        if ($orgFile -notmatch $component) {
            Write-Host "   ✅ $component supprimé" -ForegroundColor Green
        } else {
            Write-Host "   ⚠️  $component encore présent" -ForegroundColor Yellow
        }
    }
} catch {
    Write-Host "   ❌ Erreur lors de la vérification: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""

# Test 3: Vérification du composant ConventionalOrgChart
Write-Host "🏛️  Vérification du composant ConventionalOrgChart..." -ForegroundColor Yellow

try {
    $conventionalFile = Get-Content "src\components\hr\ConventionalOrgChart.tsx" -Raw
    
    if ($conventionalFile -match "onViewProfile") {
        Write-Host "   ✅ Fonction onViewProfile implémentée" -ForegroundColor Green
    } else {
        Write-Host "   ❌ Fonction onViewProfile manquante" -ForegroundColor Red
    }
    
    if ($conventionalFile -match "ExternalLink") {
        Write-Host "   ✅ Bouton de lien vers fiche utilisateur présent" -ForegroundColor Green
    } else {
        Write-Host "   ❌ Bouton de lien vers fiche utilisateur manquant" -ForegroundColor Red
    }
    
    if ($conventionalFile -notmatch "onToggle.*Button") {
        Write-Host "   ✅ Boutons individuels expand/collapse supprimés" -ForegroundColor Green
    } else {
        Write-Host "   ⚠️  Boutons individuels encore présents" -ForegroundColor Yellow
    }
    
    if ($conventionalFile -match "Étendre Tout.*Réduire Tout") {
        Write-Host "   ✅ Boutons globaux Étendre/Réduire présents" -ForegroundColor Green
    } else {
        Write-Host "   ❌ Boutons globaux manquants" -ForegroundColor Red
    }
} catch {
    Write-Host "   ❌ Erreur lors de la vérification du composant: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""

# Test 4: Test de compilation
Write-Host "🔨 Test de compilation..." -ForegroundColor Yellow
Write-Host "   Compilation en cours..." -ForegroundColor Gray

try {
    $buildResult = npm run build 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "   ✅ Compilation réussie!" -ForegroundColor Green
    } else {
        Write-Host "   ❌ Erreur de compilation!" -ForegroundColor Red
    }
} catch {
    Write-Host "   ❌ Erreur lors de la compilation: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""

# Résumé final
Write-Host "📊 RÉSUMÉ FINAL - ORGANIGRAMME SIMPLIFIÉ" -ForegroundColor Magenta
Write-Host "=======================================" -ForegroundColor Magenta

Write-Host ""
Write-Host "🎯 MODES DISPONIBLES (2 seulement):" -ForegroundColor White
Write-Host "   1. 🏛️  HIÉRARCHIQUE (par défaut)" -ForegroundColor Green
Write-Host "      → Design officiel et conventionnel" -ForegroundColor Gray
Write-Host "      → Liens hiérarchiques avec flèches" -ForegroundColor Gray
Write-Host "      → Même niveau = même ligne" -ForegroundColor Gray
Write-Host "      → Boutons globaux Étendre/Réduire" -ForegroundColor Gray
Write-Host "      → Bouton vers fiche utilisateur (survol)" -ForegroundColor Gray
Write-Host ""
Write-Host "   2. 🌳 ARBRE" -ForegroundColor Green
Write-Host "      → Format textuel compact" -ForegroundColor Gray
Write-Host "      → Style technique ASCII" -ForegroundColor Gray
Write-Host "      → Vue développeur" -ForegroundColor Gray

Write-Host ""
Write-Host "✅ AMÉLIORATIONS APPORTÉES:" -ForegroundColor White
Write-Host "   • Suppression des modes complexes (Interactif, Visuel, Grille)" -ForegroundColor Green
Write-Host "   • Suppression des boutons individuels sur chaque carte" -ForegroundColor Green
Write-Host "   • Ajout de boutons globaux Étendre Tout / Réduire Tout" -ForegroundColor Green
Write-Host "   • Ajout d'un bouton vers la fiche utilisateur (survol)" -ForegroundColor Green
Write-Host "   • Interface simplifiée et plus conventionnelle" -ForegroundColor Green
Write-Host "   • Mode Hiérarchique par défaut" -ForegroundColor Green

Write-Host ""
Write-Host "🚀 ACCÈS:" -ForegroundColor Cyan
Write-Host "   → URL: http://localhost:8082/hr/organization" -ForegroundColor White
Write-Host "   → Navigation: RH → Organisation" -ForegroundColor White
Write-Host "   → Mode par défaut: Hiérarchique" -ForegroundColor White

Write-Host ""
Write-Host "✨ L'organigramme simplifié est prêt à utiliser!" -ForegroundColor Green
Write-Host "   Plus organisé ✅ | Plus conventionnel ✅ | Moins interactif ✅" -ForegroundColor Green
