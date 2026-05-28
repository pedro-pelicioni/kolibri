import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { SessionProvider, useSession } from './src/context/SessionContext';
import type { RootStackParamList } from './src/navigation/types';

import { LoginScreen } from './src/screens/LoginScreen';
import { HomeScreen } from './src/screens/HomeScreen';
import { CreateCertificateScreen } from './src/screens/CreateCertificateScreen';
import { PlantPassportScreen } from './src/screens/PlantPassportScreen';
import { ScannerScreen } from './src/screens/ScannerScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

/**
 * Routes are gated by session: unauthenticated users only see Login; once
 * authenticated, the auth stack is replaced atomically by the app stack
 * (no back-stack pollution from the login screen).
 */
function RootNavigator() {
  const { session } = useSession();
  return (
    <Stack.Navigator screenOptions={{ headerShown: false, animation: 'fade' }}>
      {session ? (
        <>
          <Stack.Screen name="home" component={HomeScreen} />
          <Stack.Screen name="create" component={CreateCertificateScreen} />
          <Stack.Screen name="passport" component={PlantPassportScreen} />
          <Stack.Screen name="scanner" component={ScannerScreen} />
        </>
      ) : (
        <Stack.Screen name="login" component={LoginScreen} />
      )}
    </Stack.Navigator>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <SessionProvider>
        <NavigationContainer>
          <RootNavigator />
        </NavigationContainer>
      </SessionProvider>
    </SafeAreaProvider>
  );
}
