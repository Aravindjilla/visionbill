import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, Platform, UIManager } from 'react-native';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}
import { NavigationContainer, createNavigationContainerRef } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StatusBar } from 'expo-status-bar';
import { useFonts, Inter_400Regular, Inter_600SemiBold, Inter_700Bold } from '@expo-google-fonts/inter';
import { Outfit_600SemiBold, Outfit_700Bold } from '@expo-google-fonts/outfit';
import * as SplashScreen from 'expo-splash-screen';

import { Colors, useTheme } from './src/theme/colors';
import { LoginScreen } from './src/screens/LoginScreen';
import { ScannerScreen } from './src/screens/ScannerScreen';
import { VerificationScreen } from './src/screens/VerificationScreen';
import { SplitScreen } from './src/screens/SplitScreen';
import { DashboardScreen } from './src/screens/DashboardScreen';
import { PantryScreen } from './src/screens/PantryScreen';
import { GroupsScreen } from './src/screens/GroupsScreen';
import { LoyaltyWalletScreen } from './src/screens/LoyaltyWalletScreen';
import { SubscriptionsScreen } from './src/screens/SubscriptionsScreen';
import { SettlementScreen } from './src/screens/SettlementScreen';
import { ReceiptHistoryScreen } from './src/screens/ReceiptHistoryScreen';
import { PrivacyScreen } from './src/screens/PrivacyScreen';
import { SCREENS } from './src/utils/constants';

import { QueryClient } from '@tanstack/react-query';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import AsyncStorage from '@react-native-async-storage/async-storage';

import * as Haptics from 'expo-haptics';
import { ProfileScreen } from './src/screens/ProfileScreen';

import { ErrorBoundary } from './src/components/ErrorBoundary';
import { AppTourProvider } from './src/components/AppTourProvider';

import * as Notifications from 'expo-notifications';
import { useAuthStore } from './src/store/useAuthStore';
import { getUserId } from './src/utils/auth';
import { Alert } from 'react-native';
import { registerForPushNotificationsAsync } from './src/utils/notifications';

export const navigationRef = createNavigationContainerRef();

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

// Notifications.setNotificationHandler logic remains here as it's root configuration

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      gcTime: 1000 * 60 * 60 * 24 * 7, // 7 days cache
      staleTime: 1000 * 60 * 10,      // 10 minutes fresh
      retry: 2,
    },
  },
});

const asyncStoragePersister = createAsyncStoragePersister({
  storage: AsyncStorage,
});

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

const CustomScanButton = (props: any) => {
  const theme = useTheme();
  return (
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
        backgroundColor: theme.primary,
        shadowColor: theme.primary,
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
};

const MainTabs = () => {
  const theme = useTheme();
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: { backgroundColor: theme.surface, borderTopColor: theme.border, height: 85, paddingBottom: 25, paddingTop: 10 },
        tabBarActiveTintColor: theme.primary,
        tabBarInactiveTintColor: theme.textMuted,
        tabBarLabelStyle: { fontFamily: 'Inter_600SemiBold', fontSize: 10 },
      }}
      screenListeners={{
        state: () => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        },
      }}
    >
    <Tab.Screen 
      name={SCREENS.DASHBOARD} 
      component={DashboardScreen} 
      options={{ tabBarLabel: 'Home', tabBarIcon: () => <Text>🏠</Text> }}
    />
    <Tab.Screen 
      name={SCREENS.PANTRY} 
      component={PantryScreen} 
      options={{ tabBarLabel: 'Pantry', tabBarIcon: () => <Text>📦</Text> }}
    />
    <Tab.Screen 
      name={SCREENS.SCAN} 
      component={ScannerScreen} 
      options={{ 
        tabBarButton: (props) => <CustomScanButton {...props} /> 
      }}
    />
    <Tab.Screen 
      name={SCREENS.GROUPS} 
      component={GroupsScreen} 
      options={{ tabBarLabel: 'Groups', tabBarIcon: () => <Text>👥</Text> }}
    />
    <Tab.Screen 
      name={SCREENS.PROFILE} 
      component={ProfileScreen} 
      options={{ tabBarLabel: 'Profile', tabBarIcon: () => <Text>👤</Text> }}
    />
  </Tab.Navigator>
  );
};

import { OnboardingScreen } from './src/screens/OnboardingScreen';

export default function App() {
  const [showOnboarding, setShowOnboarding] = React.useState(false);
  const { accessToken, isLoading: isAuthLoading, initialize } = useAuthStore();
  
  const notificationListener = React.useRef<any>(null);
  const responseListener = React.useRef<any>(null);

  const [fontsLoaded] = useFonts({
    Inter_400Regular: Inter_400Regular,
    Inter_600SemiBold: Inter_600SemiBold,
    Inter_700Bold: Inter_700Bold,
    Outfit_600SemiBold: Outfit_600SemiBold,
    Outfit_700Bold: Outfit_700Bold,
  });

  useEffect(() => {
    (async () => {
      const hasOnboarded = await AsyncStorage.getItem('HAS_ONBOARDED');
      if (!hasOnboarded) setShowOnboarding(true);
      await initialize();
      await registerForPushNotificationsAsync();
    })();
  }, []);

  useEffect(() => {
    // Foreground listener
    notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
      const data = notification.request.content.data;
      if (data && data.scanId) {
        Alert.alert(
          'Scan Complete! 🧾',
          'Your receipt has been processed. Would you like to view it now?',
          [
            { text: 'Later', style: 'cancel' },
            { 
              text: 'View Now', 
              onPress: () => {
                if (navigationRef.isReady()) {
                  navigationRef.navigate('Verification' as never);
                }
              }
            }
          ]
        );
      }
    });

    // Response listener (tray click)
    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      const data = response.notification.request.content.data;
      
      if (data && data.scanId) {
        setTimeout(() => {
          if (navigationRef.isReady()) {
            navigationRef.navigate('Verification' as never);
          }
        }, 500);
      } else if (data && (data.type === 'price_spike' || data.type === 'expiry')) {
        setTimeout(() => {
          if (navigationRef.isReady()) {
            (navigationRef as any).navigate(SCREENS.MAIN, { screen: SCREENS.DASHBOARD });
          }
        }, 500);
      }
    });

    return () => {
      if (notificationListener.current) notificationListener.current.remove();
      if (responseListener.current) responseListener.current.remove();
    };
  }, []);

  const initializeApp = async () => {
    const hasOnboarded = await AsyncStorage.getItem('HAS_ONBOARDED');
    if (!hasOnboarded) setShowOnboarding(true);

    await initialize();
    await registerForPushNotificationsAsync();
  };

  const handleFinishOnboarding = async () => {
    await AsyncStorage.setItem('HAS_ONBOARDED', 'true');
    setShowOnboarding(false);
  };

  if (!fontsLoaded || isAuthLoading) return null;

  const isAuthenticated = !!accessToken;

  if (showOnboarding) {
    return <OnboardingScreen onFinish={handleFinishOnboarding} />;
  }

  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{ persister: asyncStoragePersister }}
    >
      <ErrorBoundary>
        <AppTourProvider>
          <NavigationContainer ref={navigationRef}>
            <StatusBar style="auto" />
            <Stack.Navigator
              initialRouteName={isAuthenticated ? SCREENS.MAIN : SCREENS.LOGIN}
              screenOptions={{
                headerShown: false,
              }}
            >
              <Stack.Screen name={SCREENS.LOGIN} component={LoginScreen} />
              <Stack.Screen name={SCREENS.MAIN} component={MainTabs} />
              <Stack.Screen name={SCREENS.VERIFICATION} component={VerificationScreen} />
              <Stack.Screen name={SCREENS.SPLIT} component={SplitScreen} />
                <Stack.Screen name={SCREENS.LOYALTY_WALLET} component={LoyaltyWalletScreen} />
              <Stack.Screen name={SCREENS.SUBSCRIPTIONS} component={SubscriptionsScreen} />
              <Stack.Screen name={SCREENS.SETTLEMENT} component={SettlementScreen} />
              <Stack.Screen name={SCREENS.RECEIPT_HISTORY} component={ReceiptHistoryScreen} />
              <Stack.Screen name={SCREENS.PRIVACY} component={PrivacyScreen} />
            </Stack.Navigator>
          </NavigationContainer>
        </AppTourProvider>
      </ErrorBoundary>
    </PersistQueryClientProvider>
  );
}
