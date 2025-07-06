# 🌳 Guide de l'Organigramme Généalogique RH

## Vue d'ensemble

Le composant `VisualOrgChart` a été complètement refactorisé pour ressembler à un véritable **arbre généalogique** avec des branches naturelles qui descendent et se connectent visuellement.

## ✨ Nouvelles fonctionnalités

### 1. Design Style Arbre Généalogique
- **Cartes compactes** : Format plus petit (192px au lieu de 256px) pour une meilleure vision d'ensemble
- **Connexions SVG** : Vraies branches avec lignes qui descendent et se connectent naturellement
- **Flèches directionnelles** : Indiquent clairement la hiérarchie
- **Gradient de fond** : Ambiance moderne avec fond dégradé

### 2. Interface Utilisateur Améliorée
- **Boutons +/- visuels** : Remplacent les chevrons par des icônes plus claires
- **Code couleur intuitif** :
  - 🟣 **Violet/Rose** : Direction (avec icône couronne)
  - 🔵 **Bleu/Cyan** : Managers (avec icône groupe)
  - ⚫ **Gris** : Employés (avec icône utilisateur)
- **Légende intégrée** : Toujours visible en haut à droite

### 3. Animations et Interactions
- **Hover effects** : Cartes qui s'agrandissent légèrement au survol
- **Transitions fluides** : Expand/collapse avec animations
- **Responsive** : S'adapte à différentes tailles d'écran

### 4. Performance Optimisée
- **Calcul automatique des dimensions** : Canvas qui s'ajuste au contenu
- **Positionnement précis** : Algorithme de placement optimisé
- **Gestion mémoire** : Tracking des positions pour éviter les recalculs

## 🎯 Modes d'affichage disponibles

Dans la page **Organisation** (`/hr/organization`), trois modes sont disponibles :

### 1. Mode Arbre 🌲
- Liste hiérarchique avec indentations
- Vue compacte pour navigation rapide

### 2. Mode Grille 📊
- Cartes alignées en grille
- Idéal pour vue d'ensemble des équipes

### 3. Mode Visuel 🌳 (NOUVEAU)
- **Arbre généalogique complet**
- Connexions visuelles entre niveaux
- Navigation expand/collapse intuitive

## 🚀 Comment utiliser

1. **Navigation** : Aller dans RH → Organisation
2. **Basculer les modes** : Utiliser les boutons "Arbre", "Grille", "Visuel"
3. **Explorer l'arbre** :
   - Cliquer sur `+` pour développer une branche
   - Cliquer sur `-` pour réduire une branche
   - Utiliser "Tout Développer" / "Tout Réduire"

## 🔧 Structure technique

### Composants principaux

1. **GenealogyNode** : Carte d'employé style généalogique
2. **GenealogyConnections** : Gestion des connexions SVG
3. **GenealogyBranch** : Rendu récursif de l'arbre
4. **VisualOrgChart** : Composant principal orchestrateur

### Données Supabase

```sql
-- Requête utilisée
SELECT 
  id, first_name, last_name, manager_id,
  positions!inner(title),
  departments!inner(id, name),
  branches!inner(name)
FROM employees 
WHERE employment_status = 'active'
```

## 📱 Responsive Design

- **Desktop** : Arbre complet avec toutes les connexions
- **Tablet** : Cartes ajustées, scroll horizontal si nécessaire
- **Mobile** : Mode liste recommandé (basculer vers "Arbre")

## 🎨 Personnalisation

### Couleurs par niveau hiérarchique
```typescript
level === 0 ? 'purple-to-pink' :     // Direction
hasSubordinates ? 'blue-to-cyan' :   // Managers  
'gray-to-gray'                       // Employés
```

### Dimensions configurables
```typescript
const nodeWidth = 200;      // Largeur des cartes
const nodeHeight = 120;     // Hauteur des cartes  
const levelGap = 150;       // Espacement vertical entre niveaux
```

## 🚧 Améliorations futures

- [ ] Animation des connexions lors de l'expand/collapse
- [ ] Mode plein écran pour très grandes organisations
- [ ] Export PDF/PNG de l'organigramme
- [ ] Recherche/filtre dans l'arbre
- [ ] Zoom et pan pour navigation dans de grands arbres
- [ ] Mode "Focus" sur une branche spécifique

## ✅ Tests et validation

Le composant a été testé avec :
- ✅ Build TypeScript sans erreurs
- ✅ Rendu correct avec données Supabase  
- ✅ Expand/collapse fonctionnel
- ✅ Modes de basculement opérationnels
- ✅ Responsive design validé

---

*Intégré dans le Sprint 2 du plan de refonte Enterprise OS Genesis Framework*
