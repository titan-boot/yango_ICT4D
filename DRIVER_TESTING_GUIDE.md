# 🧪 Guide de Test - Fonctionnalités Chauffeur

## 📋 Checklist de Test Fonctionnel

### Jours 1-2: Interface et Géolocalisation

#### Test 1: Écran d'accueil chauffeur
- [ ] L'écran se charge sans erreur
- [ ] Le message de salutation affiche le nom du chauffeur
- [ ] L'indicateur de statut est visible
- [ ] La carte s'affiche
- [ ] Les statistiques sont visibles quand en ligne

#### Test 2: Statut en ligne/hors ligne
- [ ] Le switch bascule entre en ligne et hors ligne
- [ ] L'indicateur visuel change (🔴 ↔️ 🟢)
- [ ] Firestore se met à jour quand on bascule
- [ ] La géolocalisation démarre en ligne
- [ ] La géolocalisation s'arrête hors ligne

#### Test 3: Geolocalisation et carte
- [ ] Le marqueur apparaît sur la carte
- [ ] La carte centre sur la position actuelle
- [ ] La position se met à jour en temps réel
- [ ] La position est synchronisée avec Firestore
- [ ] Fonctionne sur terrain plat et routes
- [ ] La précision GPS est acceptable (< 10 mètres)

### Jour 3: Gestion des courses

#### Test 4: Pop-up de réception
- [ ] Le pop-up s'affiche quand une course est disponible
- [ ] Les détails du trajet sont affichés correctement
  - [ ] Adresse de départ
  - [ ] Adresse d'arrivée
  - [ ] Distance en km
  - [ ] Durée estimée
  - [ ] Tarif proposé
- [ ] Les informations du client s'affichent
- [ ] Le pop-up peut être fermé

#### Test 5: Bouton Accepter
- [ ] Le bouton est cliquable
- [ ] L'état devient "processing" pendant le traitement
- [ ] Firestore met à jour le statut à "ACCEPTED"
- [ ] L'ID du chauffeur est enregistré
- [ ] Le pop-up se ferme après acceptation
- [ ] Une confirmation est affichée
- [ ] Le message d'erreur s'affiche en cas d'échec

#### Test 6: Bouton Refuser
- [ ] Le bouton est cliquable
- [ ] L'état devient "processing" pendant le traitement
- [ ] Firestore met à jour le statut à "CANCELLED"
- [ ] Le pop-up se ferme après refus
- [ ] La prochaine course s'affiche (si disponible)
- [ ] Le message d'erreur s'affiche en cas d'échec

#### Test 7: Écoute Firestore
- [ ] Les courses s'affichent uniquement si le chauffeur est à proximité
- [ ] Le rayon de 5 km fonctionne correctement
- [ ] Les courses sont triées par distance
- [ ] Les mises à jour en temps réel fonctionnent
- [ ] Le nombre de courses affichées est correct
- [ ] Les listeners se nettoient quand hors ligne

---

## 🧬 Données de Test Firestore

### Créer un chauffeur test:

```json
{
  "collection": "drivers",
  "documentId": "driver_test_001",
  "data": {
    "name": "Ahmed Test",
    "email": "ahmed@test.com",
    "isOnline": false,
    "rating": 4.8,
    "completedRides": 245,
    "currentPosition": null,
    "lastUpdated": "2026-05-27T10:00:00Z"
  }
}
```

### Créer une course test:

```json
{
  "collection": "rides",
  "documentId": "ride_test_001",
  "data": {
    "clientId": "client_test_001",
    "status": "pending",
    "pickupLocation": {
      "latitude": 4.0511,
      "longitude": 9.7679
    },
    "dropoffLocation": {
      "latitude": 4.0580,
      "longitude": 9.7750
    },
    "pickupGeohash": "s05up6rz5f",
    "pickupAddress": "Douala, Boulevard de la Liberté",
    "dropoffAddress": "Douala, Avenue Kennedy",
    "distance": 5000,
    "duration": 900,
    "fare": 2500,
    "requestedAt": "2026-05-27T10:15:00Z"
  }
}
```

---

## 🐛 Tests de Débogage

### Test: Vérifier la position en temps réel

1. Mettre le chauffeur en ligne
2. Ouvrir Firebase Console → Firestore
3. Naviguer vers `drivers/{driverId}`
4. Voir `currentPosition` se mettre à jour en temps réel
5. Comparer avec `navigator.geolocation` sur l'appareil

### Test: Vérifier l'acceptation de course

1. Créer une course test dans Firestore
2. S'assurer que le chauffeur est dans le rayon (< 5 km)
3. Voir le pop-up s'afficher
4. Cliquer sur "Accepter"
5. Vérifier que Firestore montre:
   - `status: "accepted"`
   - `driverId: "driver_test_001"`
   - `acceptedAt: <timestamp>`

### Test: Vérifier le géofencing

1. Créer plusieurs courses test:
   - Proche (< 5 km)
   - Loin (> 5 km)
2. Mettre le chauffeur en ligne
3. Vérifier que seules les courses proches s'affichent
4. Vérifier que les courses sont triées par distance

---

## 📊 Métriques de Performance

### À mesurer:

| Métrique | Cible | Méthode |
|----------|-------|--------|
| Temps de chargement | < 2s | DevTools |
| Latence Firestore | < 500ms | Firebase Console |
| Précision GPS | < 10m | Comparaison avec Google Maps |
| Actualisations par minute | 6 | Firestore monitoring |
| Mémoire utilisée | < 50MB | DevTools Memory |

---

## 🚨 Scénarios d'Erreur à Tester

### 1. Pas de géolocalisation
- [ ] Désactiver le GPS
- [ ] Vérifier le message d'erreur
- [ ] Vérifier que l'app ne crash pas
- [ ] Ajouter une position par défaut (Douala)

### 2. Perte de connexion Internet
- [ ] Passer en mode avion
- [ ] Vérifier que les données en cache s'affichent
- [ ] Vérifier la reconnexion automatique
- [ ] Vérifier les messages d'erreur

### 3. Permission de géolocalisation refusée
- [ ] Refuser la permission au premier lancement
- [ ] Vérifier le message d'erreur
- [ ] Tester la modification des permissions dans les paramètres

### 4. Firestore indisponible
- [ ] Désactiver les règles Firestore temporairement
- [ ] Vérifier le message d'erreur
- [ ] Vérifier la réactivation

---

## 🎯 Cas d'Usage de Test

### Scénario 1: Chauffeur accepte une course
```
1. Chauffeur A se met en ligne à Douala
2. Client crée une demande de course près de Chauffeur A
3. Chauffeur A reçoit le pop-up
4. Chauffeur A clique sur "Accepter"
5. Statut change à "accepted"
6. Chauffeur A passe à l'écran de navigation
✅ Attente: Tout fonctionne sans erreur
```

### Scénario 2: Chauffeur refuse une course
```
1. Chauffeur A se met en ligne
2. Client crée une demande
3. Chauffeur A reçoit le pop-up
4. Chauffeur A clique sur "Refuser"
5. Le pop-up se ferme
6. Une autre course s'affiche (si disponible)
✅ Attente: Pas d'erreur, interface réactive
```

### Scénario 3: Chauffeur se met hors ligne
```
1. Chauffeur A est en ligne avec 3 courses en attente
2. Chauffeur A clique sur le Switch "Hors ligne"
3. Statut change immédiatement
4. Les courses disparaissent
5. Le nombre de courses affichées devient 0
✅ Attente: Interface responsive, Firestore mis à jour
```

---

## 📝 Points de Vérification du Code

### RideRequestPopup.tsx
- [ ] Le driverId est passé correctement en prop
- [ ] Les boutons accepter/refuser fonctionnent
- [ ] Les états d'erreur s'affichent
- [ ] Les styles sont corrects sur tous les appareils
- [ ] L'ActivityIndicator s'affiche pendant le traitement

### DriverHomeScreen.tsx
- [ ] Les useEffect se nettoient correctement
- [ ] Les listeners Firestore se créent/détruisent
- [ ] La position se met à jour en temps réel
- [ ] Le statut en ligne/hors ligne fonctionne
- [ ] Les erreurs de géolocalisation sont gérées

### rideService.ts
- [ ] Le geofencing calcule les distances correctement
- [ ] Les listeners retournent les bonnes courses
- [ ] Les statuts des courses sont mis à jour
- [ ] Les timestamps sont enregistrés
- [ ] Les erreurs sont loggées

### driverStatusService.ts
- [ ] La création de document fonctionne (setDoc avec merge)
- [ ] Les mises à jour position sont atomiques
- [ ] Les listeners pour la position fonctionnent
- [ ] Les appels async ne créent pas de race conditions

---

## ✅ Checklist Finale

Avant de déployer:

- [ ] Tous les tests fonctionnels passent
- [ ] Pas d'erreurs console
- [ ] Performance acceptable (< 2s chargement)
- [ ] Interface responsive sur tous les appareils
- [ ] Gestion d'erreur robuste
- [ ] Pas de memory leaks
- [ ] Documentation mise à jour
- [ ] Code revue par pair
- [ ] Tests unitaires écrits (optionnel pour MVP)
- [ ] Données de test nettoyées de Firestore

---

## 📞 Support

Si vous rencontrez des problèmes:
1. Vérifier la console pour les erreurs
2. Vérifier Firebase Console pour les règles
3. Vérifier la géolocalisation sur l'appareil
4. Vérifier la connexion Internet
5. Vérifier les permissions Android/iOS

