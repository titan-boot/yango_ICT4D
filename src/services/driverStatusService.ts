import { db } from '../config/firebase';
import { doc, updateDoc, getDoc, onSnapshot, GeoPoint, setDoc } from 'firebase/firestore';
import { Timestamp } from 'firebase/firestore';

/**
 * Gestion du statut du chauffeur (En ligne / Hors ligne)
 * et position en temps réel
 */

/**
 * Créer ou mettre à jour le statut du chauffeur
 */
export async function updateDriverStatus(
  driverId: string,
  isOnline: boolean,
  position?: { lat: number; lng: number }
) {
  try {
    const driverRef = doc(db, 'drivers', driverId);
    const updateData: any = {
      isOnline,
      lastUpdated: Timestamp.now(),
    };

    if (position) {
      updateData.currentPosition = new GeoPoint(position.lat, position.lng);
    }

    // Utiliser setDoc avec merge pour éviter les erreurs si le document n'existe pas
    await setDoc(driverRef, updateData, { merge: true });
    
    console.log(`Statut du chauffeur ${driverId} mis à jour: ${isOnline ? 'En ligne' : 'Hors ligne'}`);
  } catch (error) {
    console.error('Erreur lors de la mise à jour du statut du chauffeur:', error);
    throw error;
  }
}

/**
 * Écouter les mises à jour de position du chauffeur en temps réel
 */
export function subscribeToDriverPosition(
  driverId: string,
  callback: (position: { lat: number; lng: number } | null) => void
) {
  const driverRef = doc(db, 'drivers', driverId);
  
  return onSnapshot(driverRef, (docSnap) => {
    if (docSnap.exists()) {
      const data = docSnap.data();
      if (data.currentPosition) {
        const pos = data.currentPosition;
        callback({ lat: pos.latitude, lng: pos.longitude });
      } else {
        callback(null);
      }
    } else {
      callback(null);
    }
  }, (error) => {
    console.error('Erreur lors de l\'écoute de la position du chauffeur:', error);
    callback(null);
  });
}

/**
 * Obtenir les informations du chauffeur
 */
export async function getDriverInfo(driverId: string) {
  try {
    const driverRef = doc(db, 'drivers', driverId);
    const docSnap = await getDoc(driverRef);
    
    if (docSnap.exists()) {
      return docSnap.data();
    }
    return null;
  } catch (error) {
    console.error('Erreur lors de la récupération des informations du chauffeur:', error);
    return null;
  }
}

/**
 * Vérifier si un chauffeur est en ligne
 */
export async function isDriverOnline(driverId: string): Promise<boolean> {
  try {
    const driverInfo = await getDriverInfo(driverId);
    return driverInfo?.isOnline ?? false;
  } catch (error) {
    console.error('Erreur lors de la vérification du statut:', error);
    return false;
  }
}

/**
 * Mettre le chauffeur hors ligne
 */
export async function setDriverOffline(driverId: string) {
  try {
    await updateDriverStatus(driverId, false);
  } catch (error) {
    console.error('Erreur lors de la mise du chauffeur hors ligne:', error);
    throw error;
  }
}
