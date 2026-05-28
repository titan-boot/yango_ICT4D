import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';

import ClientHomeScreen from '../screens/ClientHomeScreen';
import DriverMainScreen from '../screens/DriverMainScreen';
import RoleSelectionScreen from '../screens/RoleSelectionScreen';

const Stack = createStackNavigator();

export default function AppNavigator() {
  return (
    <Stack.Navigator
      initialRouteName="RoleSelection"
      screenOptions={{ headerShown: false }}
    >
      {/* 🎯 Sélection du rôle */}
      <Stack.Screen name="RoleSelection" component={RoleSelectionScreen} />

      {/* 👤 Flux Client */}
      <Stack.Screen name="ClientHome" component={ClientHomeScreen} />

      {/* 🚖 Flux Chauffeur — DriverMainScreen gère la navigation interne */}
      <Stack.Screen
        name="DriverMain"
        children={(props) => (
          <DriverMainScreen
            {...props}
            driverId="driver_test_001"
            driverName="Chauffeur Test"
          />
        )}
      />
    </Stack.Navigator>
  );
}
