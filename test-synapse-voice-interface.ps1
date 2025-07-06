#!/usr/bin/env pwsh

Write-Host "🎯 Test de Validation - Nouveau Composant SynapseVoiceInterface" -ForegroundColor Cyan
Write-Host "=====================================================================" -ForegroundColor Cyan
Write-Host ""

$testResults = @()

# Test 1: Vérification des fichiers créés
Write-Host "📁 Test 1: Vérification des fichiers du nouveau système..." -ForegroundColor Yellow

$requiredFiles = @(
    "src/components/ai/SynapseVoiceInterface.tsx",
    "src/components/ai/SynapseVolumeVisualizer.tsx", 
    "src/components/ai/synapse-voice-interface.scss",
    "src/components/ai/synapse-volume-visualizer.scss",
    "src/hooks/use-synapse-voice.ts",
    "src/lib/synapse-voice-client.ts",
    "src/lib/synapse-audio-streamer.ts",
    "src/lib/audioworklet-registry.ts",
    "src/lib/worklets/synapse-volume-meter.ts",
    "src/lib/worklets/synapse-audio-processor.ts"
)

$allFilesExist = $true
foreach ($file in $requiredFiles) {
    if (Test-Path $file) {
        Write-Host "   ✅ $file" -ForegroundColor Green
    } else {
        Write-Host "   ❌ $file - MANQUANT" -ForegroundColor Red
        $allFilesExist = $false
    }
}

if ($allFilesExist) {
    Write-Host "✅ Tous les fichiers requis sont présents" -ForegroundColor Green
    $testResults += "✅ Fichiers système: PASS"
} else {
    Write-Host "❌ Certains fichiers sont manquants" -ForegroundColor Red
    $testResults += "❌ Fichiers système: FAIL"
}

Write-Host ""

# Test 2: Vérification des imports et remplacement
Write-Host "🔄 Test 2: Vérification du remplacement dans les composants..." -ForegroundColor Yellow

$globalVoiceAssistant = Get-Content "src/components/ai/GlobalVoiceAssistant.tsx" -Raw
$enhancedGlobalVoiceAssistant = Get-Content "src/components/ai/EnhancedGlobalVoiceAssistant.tsx" -Raw

if ($globalVoiceAssistant -match "SynapseVoiceInterface" -and $globalVoiceAssistant -notmatch "GeminiLiveInterface") {
    Write-Host "   ✅ GlobalVoiceAssistant.tsx - Import SynapseVoiceInterface correct" -ForegroundColor Green
    $globalImportOk = $true
} else {
    Write-Host "   ❌ GlobalVoiceAssistant.tsx - Import non mis à jour" -ForegroundColor Red
    $globalImportOk = $false
}

if ($enhancedGlobalVoiceAssistant -match "SynapseVoiceInterface" -and $enhancedGlobalVoiceAssistant -notmatch "GeminiLiveInterface") {
    Write-Host "   ✅ EnhancedGlobalVoiceAssistant.tsx - Import SynapseVoiceInterface correct" -ForegroundColor Green
    $enhancedImportOk = $true
} else {
    Write-Host "   ❌ EnhancedGlobalVoiceAssistant.tsx - Import non mis à jour" -ForegroundColor Red
    $enhancedImportOk = $false
}

if ($globalImportOk -and $enhancedImportOk) {
    Write-Host "✅ Remplacement des imports réussi" -ForegroundColor Green
    $testResults += "✅ Remplacement imports: PASS"
} else {
    Write-Host "❌ Remplacement des imports incomplet" -ForegroundColor Red
    $testResults += "❌ Remplacement imports: FAIL"
}

Write-Host ""

# Test 3: Vérification des dépendances
Write-Host "📦 Test 3: Vérification des dépendances..." -ForegroundColor Yellow

$packageJson = Get-Content "package.json" | ConvertFrom-Json

if ($packageJson.dependencies.eventemitter3) {
    Write-Host "   ✅ eventemitter3 installé (version: $($packageJson.dependencies.eventemitter3))" -ForegroundColor Green
    $eventEmitterOk = $true
} else {
    Write-Host "   ❌ eventemitter3 non installé" -ForegroundColor Red
    $eventEmitterOk = $false
}

if ($packageJson.devDependencies."sass-embedded") {
    Write-Host "   ✅ sass-embedded installé (version: $($packageJson.devDependencies.'sass-embedded'))" -ForegroundColor Green
    $sassOk = $true
} else {
    Write-Host "   ❌ sass-embedded non installé" -ForegroundColor Red
    $sassOk = $false
}

if ($eventEmitterOk -and $sassOk) {
    Write-Host "✅ Dépendances correctement installées" -ForegroundColor Green
    $testResults += "✅ Dépendances: PASS"
} else {
    Write-Host "❌ Dépendances manquantes" -ForegroundColor Red
    $testResults += "❌ Dépendances: FAIL"
}

Write-Host ""

# Test 4: Compilation TypeScript
Write-Host "🔧 Test 4: Test de compilation TypeScript..." -ForegroundColor Yellow

try {
    $tscOutput = npx tsc --noEmit --skipLibCheck 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "   ✅ Compilation TypeScript réussie" -ForegroundColor Green
        $testResults += "✅ Compilation TS: PASS"
    } else {
        Write-Host "   ❌ Erreurs de compilation TypeScript:" -ForegroundColor Red
        Write-Host $tscOutput -ForegroundColor Red
        $testResults += "❌ Compilation TS: FAIL"
    }
} catch {
    Write-Host "   ❌ Erreur lors du test de compilation: $_" -ForegroundColor Red
    $testResults += "❌ Compilation TS: ERROR"
}

Write-Host ""

# Test 5: Architecture event-driven
Write-Host "🎭 Test 5: Vérification de l'architecture event-driven..." -ForegroundColor Yellow

$synapseClientContent = Get-Content "src/lib/synapse-voice-client.ts" -Raw
$useHookContent = Get-Content "src/hooks/use-synapse-voice.ts" -Raw

$eventDrivenFeatures = @(
    @{ File = "synapse-voice-client.ts"; Pattern = "extends EventEmitter"; Name = "EventEmitter héritage" },
    @{ File = "synapse-voice-client.ts"; Pattern = "eventemitter3"; Name = "Import eventemitter3" },
    @{ File = "use-synapse-voice.ts"; Pattern = "client\.on\("; Name = "Event listeners dans hook" },
    @{ File = "use-synapse-voice.ts"; Pattern = "handleStatusChange"; Name = "Gestionnaires d'événements" }
)

$eventDrivenOk = $true
foreach ($feature in $eventDrivenFeatures) {
    if ($feature.File -eq "synapse-voice-client.ts") {
        $content = $synapseClientContent
    } else {
        $content = $useHookContent
    }
    
    if ($content -match $feature.Pattern) {
        Write-Host "   ✅ $($feature.Name)" -ForegroundColor Green
    } else {
        Write-Host "   ❌ $($feature.Name) - NON TROUVÉ" -ForegroundColor Red
        $eventDrivenOk = $false
    }
}

if ($eventDrivenOk) {
    Write-Host "✅ Architecture event-driven implémentée" -ForegroundColor Green
    $testResults += "✅ Architecture event-driven: PASS"
} else {
    Write-Host "❌ Architecture event-driven incomplète" -ForegroundColor Red
    $testResults += "❌ Architecture event-driven: FAIL"
}

Write-Host ""

# Test 6: AudioWorklets
Write-Host "🎵 Test 6: Vérification des AudioWorklets..." -ForegroundColor Yellow

$workletFiles = @(
    "src/lib/worklets/synapse-volume-meter.ts",
    "src/lib/worklets/synapse-audio-processor.ts"
)

$audioWorkletOk = $true
foreach ($workletFile in $workletFiles) {
    if (Test-Path $workletFile) {
        $workletContent = Get-Content $workletFile -Raw
        if ($workletContent -match "AudioWorkletProcessor") {
            Write-Host "   ✅ $workletFile - AudioWorkletProcessor trouvé" -ForegroundColor Green
        } else {
            Write-Host "   ❌ $workletFile - AudioWorkletProcessor manquant" -ForegroundColor Red
            $audioWorkletOk = $false
        }
    } else {
        Write-Host "   ❌ $workletFile - Fichier manquant" -ForegroundColor Red
        $audioWorkletOk = $false
    }
}

if ($audioWorkletOk) {
    Write-Host "✅ AudioWorklets correctement implémentés" -ForegroundColor Green
    $testResults += "✅ AudioWorklets: PASS"
} else {
    Write-Host "❌ AudioWorklets manquants ou incorrects" -ForegroundColor Red
    $testResults += "❌ AudioWorklets: FAIL"
}

Write-Host ""

# Résumé final
Write-Host "📊 RÉSUMÉ DES TESTS" -ForegroundColor Cyan
Write-Host "===================" -ForegroundColor Cyan

$passCount = ($testResults | Where-Object { $_ -match "PASS" }).Count
$totalCount = $testResults.Count

foreach ($result in $testResults) {
    if ($result -match "PASS") {
        Write-Host $result -ForegroundColor Green
    } else {
        Write-Host $result -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "Score: $passCount/$totalCount tests réussis" -ForegroundColor $(if ($passCount -eq $totalCount) { "Green" } else { "Yellow" })

if ($passCount -eq $totalCount) {
    Write-Host ""
    Write-Host "🎉 SUCCÈS! Le nouveau système SynapseVoiceInterface est opérationnel!" -ForegroundColor Green
    Write-Host "✨ Prêt pour les tests en mode développement sur http://localhost:8080" -ForegroundColor Green
} else {
    Write-Host ""
    Write-Host "⚠️  Il reste quelques éléments à corriger avant que le système soit complètement fonctionnel." -ForegroundColor Yellow
}

Write-Host ""
