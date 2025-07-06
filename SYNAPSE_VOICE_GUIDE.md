# 🎤 Guide d'Utilisation - Synapse Voice Assistant

## 🎯 Comment Tester l'Interface Vocale

### 1. 🌐 Accéder à l'Application
- Ouvrez votre navigateur sur **http://localhost:8080**
- Connectez-vous avec vos identifiants
- Accédez au **Dashboard**

### 2. 🧠 Ouvrir l'Assistant Vocal
1. Cherchez le **bouton flottant violet** en bas à droite (icône cerveau)
2. Cliquez dessus pour ouvrir l'interface Synapse
3. Sélectionnez l'onglet **"Voice Live"**

### 3. 🔗 Se Connecter au Service
1. Cliquez sur le bouton **"Se connecter"**
2. Attendez le message **"Connecté"** 
3. Le statut passe de "Déconnecté" à "Connecté" ✅

### 4. 🎙️ Utiliser l'Interface Vocale
1. Cliquez sur **"Parler"** (icône microphone)
2. Le visualiseur audio s'anime en temps réel
3. Parlez dans votre microphone
4. Le système capture et traite votre voix
5. Cliquez sur **"Arrêter"** pour terminer

### 5. 📊 Observer les Fonctionnalités

#### Visualiseur Audio
- **Animation en temps réel** basée sur le volume de votre voix
- **Détection d'activité vocale** 
- **Feedback visuel** avec couleurs et pulsations

#### Indicateurs d'État
- **Statut de connexion** : Connecté/Déconnecté/Erreur
- **Volume meter** : Niveau audio en temps réel
- **Contexte utilisateur** : Admin/Employee/Client détecté automatiquement

#### Données Contextuelles
- **Statistiques** : Projets, employés, clients, tâches
- **Rôle utilisateur** : Affiché selon vos permissions
- **Module actuel** : Dashboard, HR, Projects, etc.

## 🎛️ Contrôles Disponibles

### Boutons Principaux
- 🔗 **Se connecter** : Établit la connexion WebSocket
- 🎤 **Parler** : Démarre l'enregistrement vocal
- 🛑 **Arrêter** : Arrête l'enregistrement
- 🔊 **Volume** : Active/désactive le son de sortie
- ❌ **Déconnecter** : Ferme la connexion

### Onglets
- ⚡ **Voice Live** : Interface vocale principale
- 🧠 **Insights** : Analyses et suggestions IA

## 🔍 Tests Recommandés

### Test de Base
1. ✅ Connexion WebSocket réussie
2. ✅ Interface vocale responsive
3. ✅ Visualiseur audio animé
4. ✅ Gestion du volume en temps réel

### Test Avancé
1. 🎙️ **Test microphone** : Parlez et observez l'animation
2. 🔄 **Test reconnexion** : Déconnectez et reconnectez
3. 👤 **Test contexte** : Changez de rôle utilisateur
4. 📱 **Test responsive** : Redimensionnez la fenêtre

### Test de Performance
1. ⚡ **Latence audio** : Temps de réponse vocal
2. 🎨 **Fluidité animations** : 60fps maintenu
3. 💾 **Utilisation mémoire** : Surveillance dev tools
4. 🌐 **Stabilité WebSocket** : Connexion maintenue

## 🐛 Résolution de Problèmes

### Problèmes Courants

#### ❌ "Erreur de connexion"
- Vérifiez que le serveur de dev tourne
- Contrôlez les variables d'environnement `.env.local`
- Redémarrez le serveur : `npm run dev`

#### 🎤 "Microphone non détecté"
- Autorisez l'accès au microphone dans le navigateur
- Vérifiez les paramètres audio de votre OS
- Testez sur Chrome/Firefox/Edge

#### 🔊 "Pas de visualisation audio"
- Vérifiez que l'AudioContext est autorisé
- Testez sur un autre navigateur
- Consultez la console pour erreurs AudioWorklet

#### 🌐 "WebSocket déconnecté"
- Vérifiez l'URL Supabase dans `.env.local`
- Contrôlez votre connexion internet
- Redémarrez l'application

## 📊 Métriques à Observer

### Console DevTools
```
✅ "WebSocket connecté"
✅ "Connexion Synapse établie"  
✅ "Broadcasting to voice assistants: context_updated"
✅ Volume: 0.X (valeurs entre 0 et 1)
```

### Interface Utilisateur
- 🟢 **Statut vert** : Tout fonctionne
- 🟡 **Statut orange** : Avertissements mineurs
- 🔴 **Statut rouge** : Erreurs à corriger

## 🚀 Prochaines Étapes

### Après Tests Réussis
1. **Déploiement staging** pour tests utilisateurs
2. **Intégration tool calls** pour actions métier
3. **Optimisation performance** AudioWorklets
4. **Documentation API** complète

### Améliorations Futures
1. 🤖 **IA conversationnelle** avancée
2. 🌍 **Support multi-langues**
3. 📈 **Analytics** utilisation vocale
4. 🔐 **Sécurité** renforcée

---

**🎉 Félicitations !** Vous utilisez maintenant un assistant vocal moderne basé sur les meilleures pratiques de Google Gemini Live API, intégré nativement avec votre système Entreprise OS Genesis Framework !

*Dernière mise à jour : 6 juillet 2025*
