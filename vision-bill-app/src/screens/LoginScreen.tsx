import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import Constants from 'expo-constants';
import { Colors } from '../theme/colors';
import { Spacing } from '../theme/spacing';
import { Typography } from '../theme/typography';
import { saveTokens } from '../utils/auth';
import { SCREENS } from '../utils/constants';
import { useAuthStore } from '../store/useAuthStore';
import { registerForPushNotificationsAsync } from '../utils/notifications';
import { identifyUser } from '../utils/revenuecat';

WebBrowser.maybeCompleteAuthSession();

export const LoginScreen = ({ navigation }: any) => {
  const apiUrl = Constants.expoConfig?.extra?.apiUrl ?? 'http://localhost:3000';
  const googleClientId = Constants.expoConfig?.extra?.googleClientId ?? '';

  const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
    clientId: googleClientId,
  });

  useEffect(() => {
    if (response?.type === 'success') {
      const { id_token } = response.params;
      handleGoogleToken(id_token);
    } else if (response?.type === 'error') {
      Alert.alert('Sign-in failed', 'Google authentication was cancelled or failed. Please try again.');
    }
  }, [response]);

  const handleGoogleToken = async (idToken: string) => {
    const { setSession } = useAuthStore.getState();
    try {
      const res = await fetch(`${apiUrl}/auth/google-mobile`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken }),
      });

      if (!res.ok) throw new Error('Authentication failed');

      const data = await res.json();
      const { accessToken, refreshToken, user } = data;

      await saveTokens(String(user.id), accessToken, refreshToken);
      setSession(String(user.id), accessToken, user.tier ?? 'free');

      await identifyUser(String(user.id));
      await registerForPushNotificationsAsync();
      navigation.navigate(SCREENS.MAIN);
    } catch {
      Alert.alert('Sign-in failed', 'Could not complete sign-in. Please try again.');
    }
  };

  const handleLogin = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await promptAsync();
  };

  const isLoading = !request;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.hero}>
        <View style={styles.logoContainer}>
          <Text style={styles.logoText}>V</Text>
        </View>
        <Text style={styles.title}>VisionBill</Text>
        <Text style={styles.tagline}>The Instagram of Receipts</Text>
      </View>

      <View style={styles.footer}>
        <Pressable
          style={[styles.googleButton, isLoading && { opacity: 0.8 }]}
          disabled={isLoading}
          onPress={handleLogin}
        >
          {isLoading ? (
            <ActivityIndicator color={Colors.primary} />
          ) : (
            <>
              <View style={styles.googleIconCircle}>
                <Text style={styles.googleIconText}>G</Text>
              </View>
              <Text style={styles.googleButtonText}>Continue with Google</Text>
            </>
          )}
        </Pressable>
        <View style={styles.termsRow}>
          <Text style={styles.terms}>By continuing, you agree to our </Text>
          <Pressable onPress={() => navigation.navigate(SCREENS.TERMS)}>
            <Text style={styles.termsLink}>Terms</Text>
          </Pressable>
          <Text style={styles.terms}> and </Text>
          <Pressable onPress={() => navigation.navigate(SCREENS.PRIVACY)}>
            <Text style={styles.termsLink}>Privacy Policy</Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.surface,
    justifyContent: 'space-between',
  },
  hero: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoContainer: {
    width: 100,
    height: 100,
    borderRadius: 30,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
    transform: [{ rotate: '-10deg' }],
  },
  logoText: {
    ...Typography.h1,
    fontSize: 64,
    color: Colors.onPrimary,
  },
  title: {
    ...Typography.h1,
    fontSize: 40,
    color: Colors.text,
  },
  tagline: {
    ...Typography.subtitle,
    color: Colors.textMuted,
    marginTop: 8,
  },
  footer: {
    padding: Spacing.xl,
    paddingBottom: 60,
  },
  googleButton: {
    backgroundColor: Colors.onPrimary,
    paddingVertical: Spacing.md,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  googleButtonText: {
    ...Typography.bodyBold,
    fontSize: 18,
    color: '#000',
  },
  googleIconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  googleIconText: {
    ...Typography.bodyBold,
    fontSize: 14,
    color: Colors.primary,
  },
  termsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Spacing.lg,
  },
  terms: {
    ...Typography.tiny,
    color: Colors.textMuted,
  },
  termsLink: {
    ...Typography.tiny,
    color: Colors.primary,
    textDecorationLine: 'underline',
  },
});
