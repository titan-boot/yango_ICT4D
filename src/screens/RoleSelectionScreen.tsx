import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';

export default function RoleSelectionScreen({ navigation }: any) {
  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>🚗 Yango ICT4D</Text>
      <Text style={styles.subtitle}>Choisissez votre rôle</Text>

      <TouchableOpacity
        style={[styles.button, styles.clientButton]}
        onPress={() => navigation.navigate('ClientHome')}
      >
        <Text style={styles.buttonIcon}>👤</Text>
        <Text style={styles.buttonText}>Je suis un Client</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.button, styles.driverButton]}
        onPress={() => navigation.navigate('DriverMain')}
      >
        <Text style={styles.buttonIcon}>🚖</Text>
        <Text style={styles.buttonText}>Je suis un Chauffeur</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFC107',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#aaa',
    marginBottom: 48,
  },
  button: {
    width: '100%',
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 16,
  },
  clientButton: { backgroundColor: '#1565C0' },
  driverButton: { backgroundColor: '#2E7D32' },
  buttonIcon: { fontSize: 40, marginBottom: 8 },
  buttonText: { fontSize: 18, fontWeight: 'bold', color: '#fff' },
});