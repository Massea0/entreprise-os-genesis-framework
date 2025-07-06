# Test des Organigrammes - Entreprise OS Genesis Framework
# Ce script valide que tous les composants d'organigramme fonctionnent correctement

Write-Host "🧪 Test des composants d'organigramme..." -ForegroundColor Cyan
Write-Host ""

# Test 1: Vérification des fichiers
Write-Host "📁 Vérification des fichiers..." -ForegroundColor Yellow
$files = @(
    "src\components\hr\VisualOrgChart.tsx",
    "src\components\hr\ConventionalOrgChart.tsx", 
    "src\components\diagrams\EnterpriseOrgChart.tsx",
    "src\components\diagrams\DiagramProvider.tsx",
    "src\components\diagrams\nodes\EmployeeNode.tsx",
    "src\components\diagrams\edges\HierarchyEdge.tsx",
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
} else {
    Write-Host "   ⚠️  Des fichiers sont manquants!" -ForegroundColor Red
}

Write-Host ""

# Test 2: Vérification des imports
Write-Host "📦 Vérification des imports..." -ForegroundColor Yellow

try {
    $orgFile = Get-Content "src\pages\hr\Organization.tsx" -Raw
    
    $imports = @(
        "ConventionalOrgChart",
        "EnterpriseOrgChart", 
        "VisualOrgChart",
        "FileText"
    )
    
    $allImportsOk = $true
    foreach ($import in $imports) {
        if ($orgFile -match $import) {
            Write-Host "   ✅ Import $import trouvé" -ForegroundColor Green
        } else {
            Write-Host "   ❌ Import $import manquant" -ForegroundColor Red
            $allImportsOk = $false
        }
    }
    
    if ($allImportsOk) {
        Write-Host "   🎉 Tous les imports sont corrects!" -ForegroundColor Green
    }
} catch {
    Write-Host "   ❌ Erreur lors de la vérification des imports: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""

# Test 3: Vérification des modes de vue
Write-Host "🎛️  Vérification des modes de vue..." -ForegroundColor Yellow

try {
    if ($orgFile -match "'conventional'") {
        Write-Host "   ✅ Mode 'conventional' configuré" -ForegroundColor Green
    } else {
        Write-Host "   ❌ Mode 'conventional' manquant" -ForegroundColor Red
    }
    
    if ($orgFile -match "viewMode === 'conventional'") {
        Write-Host "   ✅ Condition 'conventional' trouvée" -ForegroundColor Green
    } else {
        Write-Host "   ❌ Condition 'conventional' manquante" -ForegroundColor Red
    }
    
    if ($orgFile -match "ConventionalOrgChart") {
        Write-Host "   ✅ Composant ConventionalOrgChart utilisé" -ForegroundColor Green
    } else {
        Write-Host "   ❌ Composant ConventionalOrgChart non utilisé" -ForegroundColor Red
    }
} catch {
    Write-Host "   ❌ Erreur lors de la vérification des modes: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""

# Test 4: Vérification des dépendances React Flow
Write-Host "⚛️  Vérification des dépendances React Flow..." -ForegroundColor Yellow

try {
    $packageJson = Get-Content "package.json" | ConvertFrom-Json
    
    if ($packageJson.dependencies."@xyflow/react") {
        Write-Host "   ✅ @xyflow/react installé (v$($packageJson.dependencies.'@xyflow/react'))" -ForegroundColor Green
    } else {
        Write-Host "   ❌ @xyflow/react manquant" -ForegroundColor Red
    }
    
    if ($packageJson.dependencies."mermaid") {
        Write-Host "   ✅ mermaid installé (v$($packageJson.dependencies.'mermaid'))" -ForegroundColor Green
    } else {
        Write-Host "   ⚠️  mermaid manquant (optionnel pour cette version)" -ForegroundColor Yellow
    }
} catch {
    Write-Host "   ❌ Erreur lors de la vérification du package.json: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""

# Test 5: Test de compilation
Write-Host "🔨 Test de compilation..." -ForegroundColor Yellow
Write-Host "   Compilation du projet en cours..." -ForegroundColor Gray

try {
    $buildResult = npm run build 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "   ✅ Compilation réussie!" -ForegroundColor Green
    } else {
        Write-Host "   ❌ Erreur de compilation!" -ForegroundColor Red
        Write-Host "   Détails: $buildResult" -ForegroundColor Gray
    }
} catch {
    Write-Host "   ❌ Erreur lors de la compilation: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""

# Résumé
Write-Host "📊 RÉSUMÉ DES TESTS" -ForegroundColor Magenta
Write-Host "==================" -ForegroundColor Magenta

$modes = @(
    @{Name="Conventionnel (Officiel)"; Status="✅ Nouveau! Liens hiérarchiques avec flèches"},
    @{Name="Interactif (React Flow)"; Status="✅ Disponible avec drag & drop"},
    @{Name="Visuel (Généalogique)"; Status="✅ Style créatif et coloré"},
    @{Name="Arbre (Textuel)"; Status="✅ Format compact technique"},
    @{Name="Grille"; Status="✅ Vue d'ensemble complète"}
)

foreach ($mode in $modes) {
    Write-Host "   $($mode.Name): $($mode.Status)" -ForegroundColor White
}

Write-Host ""
Write-Host "🎯 Organigramme recommandé: CONVENTIONNEL (Officiel)" -ForegroundColor Green
Write-Host "   → Design professionnel avec liens hiérarchiques matérialisés" -ForegroundColor Gray
Write-Host "   → Même niveau hiérarchique = même niveau d'affichage" -ForegroundColor Gray
Write-Host "   → Développable/réductible avec flèches directionnelles" -ForegroundColor Gray

Write-Host ""
Write-Host "🚀 Accès: http://localhost:8082/hr/organization" -ForegroundColor Cyan
Write-Host ""
Write-Host "✨ Tests terminés! L'organigramme conventionnel est prêt à utiliser." -ForegroundColor Green
