import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, ActivityIndicator, Alert, ScrollView } from 'react-native';
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
import { LinearGradient } from 'expo-linear-gradient';
import { MotiView } from 'moti';
import { Camera, Zap, Users, BarChart3 } from 'lucide-react-native';

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
      <LinearGradient
        colors={[Colors.surface, '#1a1a1c', '#000']}
        style={StyleSheet.absoluteFill}
      />
      
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <MotiView 
          from={{ opacity: 0, transform: [{ translateY: -20 }] }}
          animate={{ opacity: 1, transform: [{ translateY: 0 }] }}
          transition={{ type: 'timing', duration: 1000 }}
          style={styles.hero}
        >
          <View style={styles.logoContainer}>
            <LinearGradient
              colors={[Colors.primary, '#818cf8']}
              style={styles.logoGradient}
            >
              <Text style={styles.logoText}>V</Text>
            </LinearGradient>
          </View>
          <Text style={styles.title}>VisionBill</Text>
          <Text style={styles.tagline}>Smart Receipts. Shared Life.</Text>
        </MotiView>

        <MotiView
          from={{ opacity: 0, transform: [{ scale: 0.9 }] }}
          animate={{ opacity: 1, transform: [{ scale: 1 }] }}
          transition={{ type: 'timing', duration: 800, delay: 500 }}
          style={styles.benefitsGrid}
        >
          <BenefitItem 
            icon={<Camera size={24} color={Colors.primary} />} 
            title="Instant OCR" 
            desc="Gemini-powered item extraction" 
          />
          <BenefitItem 
            icon={<Users size={24} color="#a855f7" />} 
            title="Shared Pantries" 
            desc="Track house stock together" 
          />
          <BenefitItem 
            icon={<BarChart3 size={24} color="#22c55e" />} 
            title="Price Insights" 
            desc="Track inflation on brands" 
          />
          <BenefitItem 
            icon={<Zap size={24} color="#eab308" />} 
            title="Auto-Settlement" 
            desc="Split bills with 1 tap" 
          />
        </MotiView>

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
      </ScrollView>
    </SafeAreaView>
  );
};

const BenefitItem = ({ icon, title, desc }: any) => (
  <View style={styles.benefitCard}>
    <View style={styles.benefitIcon}>{icon}</View>
    <View>
      <Text style={styles.benefitTitle}>{title}</Text>
      <Text style={styles.benefitDesc}>{desc}</Text>
    </View>
  </View>
);

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
    width: 90,
    height: 90,
    marginBottom: Spacing.lg,
    transform: [{ rotate: '-8deg' }],
  },
  logoGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 40,
  },
  benefitsGrid: {
    paddingHorizontal: Spacing.xl,
    gap: 16,
    marginBottom: 40,
  },
  benefitCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  benefitIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  benefitTitle: {
    ...Typography.bodyBold,
    color: Colors.text,
    fontSize: 15,
  },
  benefitDesc: {
    ...Typography.tiny,
    color: Colors.textMuted,
    marginTop: 2,
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
