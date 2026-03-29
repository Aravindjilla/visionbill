import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, Platform, UIManager } from 'react-native';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}
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

import * as Haptics from 'expo-haptics';
import { ProfileScreen } from './src/screens/ProfileScreen';

import { ErrorBoundary } from './src/components/ErrorBoundary';

import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import api from './src/utils/api';
import { getUserId } from './src/utils/auth';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

async function registerForPushNotificationsAsync() {
  let token;
  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== 'granted') {
      console.error('Failed to get push token for push notification!');
      return;
    }
    token = (await Notifications.getExpoPushTokenAsync()).data;
    const userId = await getUserId();
    if (userId) {
      await api.post(`/users/push-token/${userId}`, { token });
    }
  } else {
    console.warn('Must use physical device for Push Notifications');
  }

  if (Platform.OS === 'android') {
    Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  return token;
}

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
      headerShown: false,
      tabBarStyle: { backgroundColor: Colors.surface, borderTopColor: Colors.border, height: 85, paddingBottom: 25, paddingTop: 10 },
      tabBarActiveTintColor: Colors.primary,
      tabBarInactiveTintColor: Colors.textMuted,
      tabBarLabelStyle: { fontFamily: 'Inter_600SemiBold', fontSize: 10 },
    }}
    screenListeners={{
      state: () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      },
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
      name="Profile" 
      component={ProfileScreen} 
      options={{ tabBarLabel: 'Profile', tabBarIcon: () => <Text>👤</Text> }}
    />
  </Tab.Navigator>
);

import { OnboardingScreen } from './src/screens/OnboardingScreen';

export default function App() {
  const [showOnboarding, setShowOnboarding] = React.useState(false);
  const [isAuthenticated, setIsAuthenticated] = React.useState<boolean | null>(null);
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_600SemiBold,
    Inter_700Bold,
    Outfit_600SemiBold,
    Outfit_700Bold,
  });

  useEffect(() => {
    initializeApp();
  }, []);

  const initializeApp = async () => {
    // Check Onboarding
    const hasOnboarded = await AsyncStorage.getItem('HAS_ONBOARDED');
    if (!hasOnboarded) {
      setShowOnboarding(true);
    }

    // Check Auth
    const token = await AsyncStorage.getItem('vision_bill_access_token');
    setIsAuthenticated(!!token);
  };

  const handleFinishOnboarding = async () => {
    await AsyncStorage.setItem('HAS_ONBOARDED', 'true');
    setShowOnboarding(false);
  };

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
      registerForPushNotificationsAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded || isAuthenticated === null) return null;

  if (showOnboarding) {
    return <OnboardingScreen onFinish={handleFinishOnboarding} />;
  }

  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{ persister: asyncStoragePersister }}
    >
      <ErrorBoundary>
        <NavigationContainer>
          <StatusBar style="light" />
          <Stack.Navigator
            screenOptions={{
              headerShown: false,
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
      </ErrorBoundary>
    </PersistQueryClientProvider>
  );
}
