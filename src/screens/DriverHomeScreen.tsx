import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Switch,
  Image,
  SafeAreaView,
  ActivityIndicator,
  Dimensions,
  Modal,
  Alert,
} from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import Geolocation from '@react-native-community/geolocation';
import { updateDriverStatus, subscribeToDriverPosition } from '../services/driverStatusService';
import { subscribeToPendingRides, RideRequest } from '../services/rideService';
import RideRequestPopup from '../components/RideRequestPopup';

const WINDOW_WIDTH = Dimensions.get('window').width;
const WINDOW_HEIGHT = Dimensions.get('window').height;

interface DriverHomeScreenProps {
  driverId: string;
  driverName?: string;
}

export default function DriverHomeScreen({ driverId, driverName = 'Chauffeur' }: DriverHomeScreenProps) {
  const [isOnline, setIsOnline] = useState(false);
  const [currentPosition, setCurrentPosition] = useState<{ lat: number; lng: number } | null>(null);
  const [isLoadingPosition, setIsLoadingPosition] = useState(true);
  const [isLoadingRides, setIsLoadingRides] = useState(false);
  const mapRef = useRef<MapView>(null);
  const [rideRequests, setRideRequests] = useState<RideRequest[]>([]);
  const [showRidePopup, setShowRidePopup] = useState(false);
  const [currentRideRequest, setCurrentRideRequest] = useState<RideRequest | null>(null);
  const watchIdRef = useRef<number | null>(null);
  const rideUnsubscribeRef = useRef<(() => void) | null>(null);

  // Initialiser la position du chauffeur (une fois)
  useEffect(() => {
    setIsLoadingPosition(true);
    Geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setCurrentPosition({ lat: latitude, lng: longitude });
        setIsLoadingPosition(false);
      },
      (error) => {
        console.error('Erreur de géolocalisation:', error);
        // Utiliser une position par défaut pour le test (Douala)
        setCurrentPosition({ lat: 4.0511, lng: 9.7679 });
        setIsLoadingPosition(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, []);

  // Surveiller la position en temps réel si en ligne
  useEffect(() => {
    if (!isOnline || !currentPosition) return;

    watchIdRef.current = Geolocation.watchPosition(
      (position) => {
        const newPosition = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        setCurrentPosition(newPosition);
        // Mettre à jour la position du chauffeur dans Firestore
        updateDriverStatus(driverId, true, newPosition);
      },
      (error) => console.error('Erreur de suivi de position:', error),
      { enableHighAccuracy: true, distanceFilter: 10, timeout: 10000 } // Mettre à jour tous les 10 mètres
    ) as unknown as number;

    return () => {
      if (watchIdRef.current !== null) {
        Geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, [isOnline, driverId, currentPosition]);

  // Gérer le changement du statut en ligne/hors ligne
  useEffect(() => {
    if (isOnline && currentPosition) {
      updateDriverStatus(driverId, true, currentPosition);
      setIsLoadingRides(true);
    } else if (!isOnline) {
      updateDriverStatus(driverId, false);
      setIsLoadingRides(false);
    }
  }, [isOnline, driverId]);

  // Écouter les courses en attente quand en ligne
  useEffect(() => {
    if (!isOnline || !currentPosition) {
      // Arrêter d'écouter les courses
      if (rideUnsubscribeRef.current) {
        rideUnsubscribeRef.current();
      }
      return;
    }

    setIsLoadingRides(true);
    
    // S'abonner aux courses en attente dans un rayon de 5 km
    rideUnsubscribeRef.current = subscribeToPendingRides(
      currentPosition.lat,
      currentPosition.lng,
      5, // rayon de 5 km
      (rides) => {
        setRideRequests(rides);
        setIsLoadingRides(false);
        
        // Afficher le pop-up si une nouvelle course arrive et pas déjà une affichée
        if (rides.length > 0 && !showRidePopup) {
          setCurrentRideRequest(rides[0]);
          setShowRidePopup(true);
        }
      }
    );

    return () => {
      if (rideUnsubscribeRef.current) {
        rideUnsubscribeRef.current();
      }
    };
  }, [isOnline, currentPosition, showRidePopup]);

  const handleToggleOnline = async () => {
    setIsOnline(!isOnline);
  };

  const handleMapReady = () => {
    if (currentPosition && mapRef.current) {
      mapRef.current.animateToRegion({
        latitude: currentPosition.lat,
        longitude: currentPosition.lng,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      });
    }
  };

  const handleRideAccepted = () => {
    setShowRidePopup(false);
    setCurrentRideRequest(null);
    // Les autres courses seront refiltrées automatiquement
  };

  const handleRideRejected = () => {
    setShowRidePopup(false);
    // Passer à la course suivante si disponible
    if (rideRequests.length > 1) {
      setCurrentRideRequest(rideRequests[1]);
      setShowRidePopup(true);
    } else {
      setCurrentRideRequest(null);
    }
  };

  if (isLoadingPosition) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color="#FFC107" />
        <Text style={styles.loadingText}>Initialisation de la position...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* En-tête */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Bonjour, {driverName}</Text>
          <Text style={[styles.statusText, { color: isOnline ? '#4CAF50' : '#f44336' }]}>
            {isOnline ? '🟢 En ligne' : '🔴 Hors ligne'}
          </Text>
        </View>
        <View style={styles.toggleContainer}>
          <Text style={styles.toggleLabel}>{isOnline ? 'En ligne' : 'Hors ligne'}</Text>
          <Switch
            value={isOnline}
            onValueChange={handleToggleOnline}
            trackColor={{ false: '#767577', true: '#81C784' }}
            thumbColor={isOnline ? '#4CAF50' : '#f44336'}
          />
        </View>
      </View>

      {/* Carte */}
      {currentPosition ? (
        <MapView
          ref={mapRef}
          style={styles.map}
          initialRegion={{
            latitude: currentPosition.lat,
            longitude: currentPosition.lng,
            latitudeDelta: 0.05,
            longitudeDelta: 0.05,
          }}
          onMapReady={handleMapReady}
        >
          {/* Marqueur de la position actuelle */}
          <Marker
            coordinate={{
              latitude: currentPosition.lat,
              longitude: currentPosition.lng,
            }}
            title="Votre position"
            pinColor={isOnline ? '#4CAF50' : '#999'}
            description={`Lat: ${currentPosition.lat.toFixed(4)}, Lng: ${currentPosition.lng.toFixed(4)}`}
          />
        </MapView>
      ) : (
        <View style={styles.mapPlaceholder}>
          <Text>Position non disponible</Text>
        </View>
      )}

      {/* Statistiques */}
      {isOnline && (
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{isLoadingRides ? '...' : rideRequests.length}</Text>
            <Text style={styles.statLabel}>Courses en attente</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>★ 4.8</Text>
            <Text style={styles.statLabel}>Votre note</Text>
          </View>
        </View>
      )}

      {/* Pop-up de réception de course */}
      {currentRideRequest && (
        <RideRequestPopup
          visible={showRidePopup}
          rideRequest={currentRideRequest}
          driverId={driverId}
          onAccept={handleRideAccepted}
          onReject={handleRideRejected}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#1a1a1a',
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  greeting: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
  },
  toggleContainer: {
    alignItems: 'center',
    gap: 8,
  },
  toggleLabel: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '600',
  },
  map: {
    flex: 1,
  },
  mapPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#e0e0e0',
  },
  statsContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  statCard: {
    flex: 1,
    backgroundColor: '#f9f9f9',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#eee',
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
  },
  loadingText: {
    marginTop: 12,
    color: '#666',
    fontSize: 14,
  },
});
