import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { Colors } from '../theme/colors';
import { Spacing } from '../theme/spacing';
import { Typography } from '../theme/typography';
import { saveTokens } from '../utils/auth';

export const LoginScreen = ({ navigation }: any) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    setIsLoading(true);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    // Simulate real OAuth flow
    setTimeout(async () => {
      try {
        await saveTokens('demo-user-123', 'mock-access', 'mock-refresh');
        setIsLoading(false);
        navigation.navigate('Main');
      } catch (err) {
        setIsLoading(false);
        console.error('Login failed', err);
      }
    }, 1500);
  };

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
        <Text style={styles.terms}>By continuing, you agree to our Terms and Privacy Policy</Text>
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
    color: '#000', // Keep black for Google brand consistency
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
  terms: {
    ...Typography.tiny,
    color: Colors.textMuted,
    textAlign: 'center',
    marginTop: Spacing.lg,
  },
});
