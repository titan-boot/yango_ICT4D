import { db } from '../config/firebase';
import {
  collection,
  addDoc,
  doc,
  updateDoc,
  onSnapshot,
  query,
  where,
  GeoPoint,
  Timestamp,
  getDocs,
  DocumentSnapshot,
} from 'firebase/firestore';
  import { geohashForLocation, geohashQueryBounds, distanceBetween } from 'geofire-common';

/**
 * États possibles d'une course
 */
export enum RideStatus {
  PENDING = 'pending',        // En attente d'acceptation
  ACCEPTED = 'accepted',      // Acceptée par le chauffeur
  ARRIVING = 'arriving',      // Chauffeur en route vers le client
  ARRIVED = 'arrived',        // Chauffeur arrivé chez le client
  IN_PROGRESS = 'in_progress', // Course en cours
  COMPLETED = 'completed',    // Course terminée
  CANCELLED = 'cancelled',    // Course annulée
}

export interface RideRequest {
  id?: string;
  clientId: string;
  driverId?: string;
  pickupLocation: { lat: number; lng: number };
  dropoffLocation: { lat: number; lng: number };
  pickupGeohash?: string; // Pour le géofencing
  pickupAddress: string;
  dropoffAddress: string;
  status: RideStatus;
  fare: number;
  distance?: number; // En mètres ou km selon le contexte
  duration: number; // en secondes
  requestedAt: any; // Timestamp
  acceptedAt?: any;
  startedAt?: any;
  completedAt?: any;
  rating?: number;
  comments?: string;
}

/**
 * Créer une nouvelle demande de course (client)
 */
export async function createRideRequest(
  clientId: string,
  pickupLocation: { lat: number; lng: number },
  dropoffLocation: { lat: number; lng: number },
  pickupAddress: string,
  dropoffAddress: string,
  fare: number,
  distance: number,
  duration: number
): Promise<string> {
  const ride = await addDoc(collection(db, 'rides'), {
    clientId,
    pickupLocation: new GeoPoint(pickupLocation.lat, pickupLocation.lng),
    dropoffLocation: new GeoPoint(dropoffLocation.lat, dropoffLocation.lng),
    pickupAddress,
    dropoffAddress,
    status: RideStatus.PENDING,
    fare,
    distance,
    duration,
    requestedAt: Timestamp.now(),
  });
  return ride.id;
}

/**
 * Accepter une course (chauffeur)
 */
export async function acceptRide(rideId: string, driverId: string) {
  const rideRef = doc(db, 'rides', rideId);
  await updateDoc(rideRef, {
    driverId,
    status: RideStatus.ACCEPTED,
    acceptedAt: Timestamp.now(),
  });
}

/**
 * Refuser une course (chauffeur)
 */
export async function rejectRide(rideId: string) {
  const rideRef = doc(db, 'rides', rideId);
  await updateDoc(rideRef, {
    status: RideStatus.CANCELLED,
  });
}

/**
 * Signaler l'arrivée chez le client
 */
export async function markAsArrived(rideId: string) {
  const rideRef = doc(db, 'rides', rideId);
  await updateDoc(rideRef, {
    status: RideStatus.ARRIVED,
    arrivedAt: Timestamp.now(),
  });
}

/**
 * Commencer la course
 */
export async function startRide(rideId: string) {
  const rideRef = doc(db, 'rides', rideId);
  await updateDoc(rideRef, {
    status: RideStatus.IN_PROGRESS,
    startedAt: Timestamp.now(),
  });
}

/**
 * Terminer la course
 */
export async function completeRide(rideId: string) {
  const rideRef = doc(db, 'rides', rideId);
  await updateDoc(rideRef, {
    status: RideStatus.COMPLETED,
    completedAt: Timestamp.now(),
  });
}

/**
 * Écouter les courses en attente dans un rayon donné (avec géofencing)
 * IMPORTANT: Cette fonction doit être appelée avec la position actuelle du chauffeur
 */
export function subscribeToPendingRides(
  pickupLat: number,
  pickupLng: number,
  radiusKm: number = 5,
  callback: (rides: RideRequest[]) => void
) {
  // Utiliser geofire-common pour le géofencing
  const center: [number, number] = [pickupLat, pickupLng];
  const bounds = geohashQueryBounds(center, radiusKm * 1000);
  const ridesToReturn: Map<string, RideRequest> = new Map();
  let unsubscribers: (() => void)[] = [];

  // Créer des queries pour chaque limite de geohash
  bounds.forEach((bound) => {
    const q = query(
      collection(db, 'rides'),
      where('status', '==', RideStatus.PENDING),
      where('pickupGeohash', '>=', bound[0]),
      where('pickupGeohash', '<=', bound[1])
    );

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      querySnapshot.forEach((docSnap) => {
        const data = docSnap.data();
        const pickupPos = data.pickupLocation;
        
        // Vérifier si la distance est vraiment dans le rayon (car geohash est approximatif)
        if (pickupPos && pickupPos.latitude && pickupPos.longitude) {
          const distance = distanceBetween(
            [pickupPos.latitude, pickupPos.longitude],
            center
          );

          if (distance <= radiusKm) {
            ridesToReturn.set(docSnap.id, {
              id: docSnap.id,
              ...data,
              distance: distance, // Ajouter la distance calculée
            } as RideRequest);
          } else {
            ridesToReturn.delete(docSnap.id);
          }
        }
      });

      // Retourner les courses triées par distance
      const sortedRides = Array.from(ridesToReturn.values())
        .sort((a, b) => (a.distance || 0) - (b.distance || 0));
      callback(sortedRides);
    });

    unsubscribers.push(unsubscribe);
  });

  // Retourner une fonction pour nettoyer tous les listeners
  return () => {
    unsubscribers.forEach((unsub) => unsub());
  };
}

/**
 * Écouter la course actuelle du chauffeur
 */
export function subscribeToCurrentRide(
  driverId: string,
  callback: (ride: RideRequest | null) => void
) {
  const q = query(
    collection(db, 'rides'),
    where('driverId', '==', driverId),
    where('status', 'in', [
      RideStatus.ACCEPTED,
      RideStatus.ARRIVING,
      RideStatus.ARRIVED,
      RideStatus.IN_PROGRESS,
    ])
  );

  return onSnapshot(q, (querySnapshot) => {
    if (!querySnapshot.empty) {
      const doc = querySnapshot.docs[0];
      const data = doc.data();
      callback({
        id: doc.id,
        ...data,
      } as RideRequest);
    } else {
      callback(null);
    }
  });
}

/**
 * Obtenir les détails d'une course
 */
export async function getRideDetails(rideId: string): Promise<RideRequest | null> {
  try {
    const rideRef = doc(db, 'rides', rideId);
    const docSnap = await getDocs(collection(db, 'rides'));
    
    for (const d of docSnap.docs) {
      if (d.id === rideId) {
        const data = d.data();
        return { 
          id: d.id, 
          ...data 
        } as RideRequest;
      }
    }
    return null;
  } catch (error) {
    console.error('Erreur lors de la récupération des détails de la course:', error);
    return null;
  }
}
