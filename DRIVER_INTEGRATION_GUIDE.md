# 🔗 Guide d'Intégration - Architecture Système

## 📌 Vue d'ensemble de l'application

L'application Yango ICT4D est une plateforme de mobilité urbaine avec deux rôles principaux:
- **Client**: Demande des courses
- **Chauffeur**: Propose des services de transport

---

## 🏗️ Architecture Actuelle

```
┌─────────────────────────────────────────────────────┐
│                   App Principale                     │
│              (App.tsx / index.js)                    │
└─────────────────┬───────────────────────────────────┘
                  │
                  ├─► Navigation (AppNavigator.tsx)
                  │
                  ├─► Écrans Client
                  │   ├─ ClientHomeScreen
                  │   └─ ...
                  │
                  ├─► Écrans Chauffeur ✅ [NOUVEAU]
                  │   ├─ DriverMainScreen
                  │   ├─ DriverHomeScreen ✅
                  │   ├─ RideNavigationScreen
                  │   └─ RideCompletionScreen
                  │
                  ├─► Services
                  │   ├─ authService.ts
                  │   ├─ driverStatusService.ts ✅ [AMÉLIORÉ]
                  │   ├─ rideService.ts ✅ [AMÉLIORÉ]
                  │   ├─ geoService.ts
                  │   └─ ...
                  │
                  └─► Firebase (config/firebase.ts)
                      ├─ Firestore
                      ├─ Authentication
                      └─ Functions
```

---

## 📦 Dépendances Ajoutées/Utilisées

### Package.json - Vérifier ces dépendances:

```json
{
  "dependencies": {
    "react-native": "^0.73.0",
    "react": "^18.2.0",
    "@react-navigation/native": "^6.x",
    "@react-navigation/stack": "^6.x",
    "react-native-maps": "^1.x",
    "@react-native-community/geolocation": "^3.x",
    "firebase": "^10.x",
    "geofire-common": "^6.x"
  }
}
```

### Installation des dépendances manquantes:

```bash
# Si geofire-common n'est pas installé
npm install geofire-common

# Ou avec yarn
yarn add geofire-common
```

---

## 🔌 Intégration Firestore

### Règles Firestore requises:

Mettre à jour `firestore.rules`:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Authentification requise pour tous les documents
    match /drivers/{driverId} {
      allow read: if request.auth != null;
      allow write: if request.auth.uid == driverId;
      allow create: if request.auth != null;
    }
    
    match /rides/{rideId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;
      allow create: if request.auth != null;
    }
    
    match /utilisateurs/{uid} {
      allow read: if request.auth != null;
      allow write: if request.auth.uid == uid;
    }
    
    // Autres collections...
  }
}
```

### Indexes Firestore requis:

Vérifier que ces indexes existent dans Firebase Console:

```
Collection: rides
Champs: status (Ascending), pickupGeohash (Ascending)
Collection: rides
Champs: driverId (Ascending), status (Ascending)
```

---

## 🎯 Flux de Données

### Flux 1: Mise en ligne du chauffeur

```
Chauffeur clique "En ligne"
    ↓
setState(isOnline = true)
    ↓
useEffect déclenché
    ↓
updateDriverStatus(driverId, true, position)
    ↓
setDoc merge → Firestore
    ↓
watchPosition démarre
    ↓
subscribeToPendingRides démarre
    ↓
onSnapshot écoute les nouvelles courses
```

### Flux 2: Réception de course

```
Client crée une demande
    ↓
Cours ajoutée à Firestore (status: pending)
    ↓
onSnapshot détecte la nouvelle course
    ↓
Vérifie si chauffeur à proximité (< 5 km)
    ↓
Si oui: Ajoute à rideRequests
    ↓
État change → Pop-up s'affiche
    ↓
Chauffeur clique "Accepter" ou "Refuser"
```

### Flux 3: Acceptation de course

```
Chauffeur clique "Accepter"
    ↓
handleAccept exécuté
    ↓
acceptRide(rideId, driverId)
    ↓
Firestore:
  - status → "accepted"
  - driverId → driver123
  - acceptedAt → Timestamp.now()
    ↓
Pop-up se ferme
    ↓
Navigation vers RideNavigationScreen
```

---

## 📱 Passage de Props et Contexte

### Actuel (Prop drilling):

```tsx
// AppNavigator.tsx
<Stack.Screen name="DriverMain" component={DriverMainScreen} />

// App.tsx
<AppNavigator />

// DriverMainScreen accepte:
{
  driverId: string,
  driverName: string
}
```

### Amélioration suggérée: Context API

Créer `DriverContext.tsx`:

```tsx
import React, { createContext, useContext } from 'react';

interface DriverContextType {
  driverId: string;
  driverName: string;
  isOnline: boolean;
}

export const DriverContext = createContext<DriverContextType | null>(null);

export function useDriver() {
  const context = useContext(DriverContext);
  if (!context) throw new Error('useDriver must be used within DriverProvider');
  return context;
}

export function DriverProvider({ children, driverId, driverName }: any) {
  const [isOnline, setIsOnline] = React.useState(false);
  
  return (
    <DriverContext.Provider value={{ driverId, driverName, isOnline }}>
      {children}
    </DriverContext.Provider>
  );
}
```

Utilisation:

```tsx
// Dans DriverHomeScreen.tsx
const { driverId, driverName, isOnline } = useDriver();
```

---

## 🔐 Gestion d'Authentification

### Avant chaque écran chauffeur, vérifier:

```tsx
// Dans AppNavigator ou DriverMainScreen
useEffect(() => {
  const unsubscribe = auth.onAuthStateChanged((user) => {
    if (!user) {
      // Rediriger vers login
      navigation.navigate('Login');
    } else if (user.uid !== driverId) {
      // Vérifier que l'utilisateur est bien le chauffeur
      console.error('Mismatch userId/driverId');
    }
  });
  
  return unsubscribe;
}, []);
```

---

## 🔄 Prochaines Phases Recommandées

### Phase 2: Navigation et Suivi de Course (Semaine 2)

**Fichier à développer:** `src/screens/RideNavigationScreen.tsx`

```typescript
// À implémenter:
- Afficher la route sur la carte (Google Maps Directions API)
- Bouton "Arrivé chez le client"
- Suivi de la position en temps réel
- Estimation du temps d'arrivée
- Arrêt d'urgence
```

### Phase 3: Complétion et Notation (Semaine 2)

**Fichier à développer:** `src/screens/RideCompletionScreen.tsx`

```typescript
// À implémenter:
- Formulaire de fin de course
- Entrée des détails de paiement
- Système de notation du client
- Téléchargement du reçu
- Retour à l'accueil
```

### Phase 4: Chat Client-Chauffeur (Semaine 3)

```typescript
// À créer: src/components/ChatWidget.tsx
// À créer: src/services/chatService.ts
- Messaging en temps réel
- Notifications push
- Historique des messages
```

### Phase 5: Historique et Statistiques (Semaine 3)

```typescript
// À créer: src/screens/DriverStatsScreen.tsx
- Total de courses par jour/semaine/mois
- Gains totaux
- Avis des clients
- Graphiques de performance
```

---

## 🧩 Points d'Intégration Clés

### 1. Authentification
- Connecter `authService.ts` à Firebase Authentication
- Vérifier les permissions avant d'accéder aux écrans chauffeur
- Gérer la déconnexion

### 2. Notifications
- Ajouter Firebase Cloud Messaging (FCM)
- Notifier le chauffeur des courses entrantes
- Gérer les notifications en arrière-plan

### 3. Géolocalisation
- Gérer les permissions (Android & iOS)
- Gérer les erreurs de GPS
- Optimiser la consommation batterie

### 4. Performance
- Optimiser les queries Firestore
- Ajouter la pagination pour les listes
- Mettre en cache les données locales

---

## 🛠️ Outils et Commandes Utiles

### Développement

```bash
# Lancer l'application en développement
npx react-native run-android
npx react-native run-ios

# Mode debug
npx react-native start --reset-cache

# Build production
npx react-native run-android --variant release
```

### Firestore

```bash
# Exporter les données
firebase firestore:export ./backup

# Importer les données
firebase firestore:import ./backup
```

### Logs

```bash
# Android logs
adb logcat | grep "RideRequestPopup"

# React Native logs
npx react-native log-android
```

---

## 📊 Statuts de Développement

| Feature | Status | Responsable | Date |
|---------|--------|------------|------|
| Driver Home Screen | ✅ Complet | Dev 3 | 2026-05-27 |
| Online/Offline Toggle | ✅ Complet | Dev 3 | 2026-05-27 |
| Real-time Map | ✅ Complet | Dev 3 | 2026-05-27 |
| Ride Request Popup | ✅ Complet | Dev 3 | 2026-05-27 |
| Firestore Listener | ✅ Complet | Dev 3 | 2026-05-27 |
| Accept/Reject Buttons | ✅ Complet | Dev 3 | 2026-05-27 |
| **Ride Navigation** | ⏳ À faire | Dev ? | ? |
| **Ride Completion** | ⏳ À faire | Dev ? | ? |
| **Chat System** | ⏳ À faire | Dev ? | ? |
| **Notifications** | ⏳ À faire | Dev ? | ? |

---

## 🚀 Déploiement

### Avant le déploiement:

- [ ] Tous les tests passent
- [ ] Aucune erreur console
- [ ] Performance acceptable
- [ ] Gestion d'erreur robuste
- [ ] Données de test nettoyées
- [ ] Règles Firestore configurées
- [ ] Permissions Android/iOS correctes
- [ ] Icônes et splash screens actualisées
- [ ] Version bumped dans package.json
- [ ] Release notes mises à jour

### Commandes de déploiement:

```bash
# Android
cd android && ./gradlew bundleRelease

# iOS
cd ios && xcodebuild -workspace yangoict4d.xcworkspace -scheme yangoict4d -configuration Release
```

---

## 📞 Contacts et Support

- **Architecture:** [Équipe Tech Lead]
- **Firebase:** [Admin Firebase]
- **Design:** [Équipe Design]
- **QA:** [Équipe Test]

---

**Mise à jour:** 27 mai 2026
**Version:** 1.0.0-beta
**Statut:** Prêt pour intégration
