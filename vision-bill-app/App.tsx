import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StatusBar } from 'expo-status-bar';
import { useFonts, Inter_400Regular, Inter_600SemiBold, Inter_700Bold } from '@expo-google-fonts/inter';
import { Outfit_600SemiBold, Outfit_700Bold } from '@expo-google-fonts/outfit';
import * as SplashScreen from 'expo-splash-screen';

import { Colors } from './src/theme/colors';
import { LoginScreen } from './src/screens/LoginScreen';
import { ScannerScreen } from './src/screens/ScannerScreen';
import { VerificationScreen } from './src/screens/VerificationScreen';
import { SplitScreen } from './src/screens/SplitScreen';
import { GroupsScreen } from './src/screens/GroupsScreen';
import { DashboardScreen } from './src/screens/DashboardScreen';
import { PantryScreen } from './src/screens/PantryScreen';

import { QueryClient } from '@tanstack/react-query';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import AsyncStorage from '@react-native-async-storage/async-storage';

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      gcTime: 1000 * 60 * 60 * 24, // 24 hours
      staleTime: 1000 * 60 * 5, // 5 minutes
    },
  },
});

const asyncStoragePersister = createAsyncStoragePersister({
  storage: AsyncStorage,
});

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

const CustomScanButton = (props: any) => (
  <Pressable 
    {...props}
    style={{
      top: -24,
      justifyContent: 'center',
      alignItems: 'center',
    }}
  >
    <View style={{
      width: 64,
      height: 64,
      borderRadius: 32,
      backgroundColor: Colors.primary,
      shadowColor: Colors.primary,
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.3,
      shadowRadius: 10,
      elevation: 5,
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      <Text style={{ fontSize: 32 }}>📸</Text>
    </View>
  </Pressable>
);

const MainTabs = () => (
  <Tab.Navigator
    screenOptions={{
      tabBarStyle: {
        backgroundColor: Colors.surface,
        borderTopColor: Colors.border,
        height: 64,
        paddingBottom: 8,
      },
      tabBarActiveTintColor: Colors.primary,
      tabBarInactiveTintColor: Colors.textMuted,
      headerShown: false,
    }}
  >
    <Tab.Screen 
      name="Dashboard" 
      component={DashboardScreen} 
      options={{ tabBarLabel: 'Home', tabBarIcon: () => <Text>🏠</Text> }}
    />
    <Tab.Screen 
      name="Pantry" 
      component={PantryScreen} 
      options={{ tabBarLabel: 'Pantry', tabBarIcon: () => <Text>📦</Text> }}
    />
    <Tab.Screen 
      name="Scan" 
      component={ScannerScreen} 
      options={{ 
        tabBarButton: (props) => <CustomScanButton {...props} /> 
      }}
    />
    <Tab.Screen 
      name="Groups" 
      component={GroupsScreen} 
      options={{ tabBarLabel: 'Groups', tabBarIcon: () => <Text>👥</Text> }}
    />
    <Tab.Screen 
      name="Settings" 
      component={View} 
      options={{ tabBarLabel: 'Settings', tabBarIcon: () => <Text>⚙️</Text> }}
    />
  </Tab.Navigator>
);

export default function App() {
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_600SemiBold,
    Inter_700Bold,
    Outfit_600SemiBold,
    Outfit_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{ persister: asyncStoragePersister }}
    >
      <NavigationContainer>
        <StatusBar style="light" />
        <Stack.Navigator
          screenOptions={{
            headerShown: false,
            cardStyle: { backgroundColor: Colors.surface },
          }}
        >
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Main" component={MainTabs} />
          <Stack.Screen name="Verification" component={VerificationScreen} />
          <Stack.Screen name="Split" component={SplitScreen} />
          <Stack.Screen name="Groups" component={GroupsScreen} />
          <Stack.Screen name="Scanner" component={ScannerScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </PersistQueryClientProvider>
  );
}
