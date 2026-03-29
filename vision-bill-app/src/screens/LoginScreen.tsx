import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, Image, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { Colors } from '../theme/colors';
import { Spacing } from '../theme/spacing';

export const LoginScreen = ({ navigation }: any) => {
  const [isLoading, setIsLoading] = useState(false);

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
          onPress={async () => {
            setIsLoading(true);
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            // Simulate API latency
            setTimeout(() => {
              setIsLoading(false);
              navigation.navigate('Main');
            }, 1500);
          }}
        >
          {isLoading ? (
            <ActivityIndicator color={Colors.primary} />
          ) : (
            <Text style={styles.googleButtonText}>Continue with Google</Text>
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
    fontFamily: 'Outfit_700Bold',
    fontSize: 64,
    color: '#FFF',
  },
  title: {
    fontFamily: 'Outfit_700Bold',
    fontSize: 40,
    color: Colors.text,
  },
  tagline: {
    fontFamily: 'Inter_400Regular',
    fontSize: 18,
    color: Colors.textMuted,
    marginTop: 8,
  },
  footer: {
    padding: Spacing.xl,
    paddingBottom: 60,
  },
  googleButton: {
    backgroundColor: '#FFF',
    paddingVertical: Spacing.md,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  googleButtonText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 18,
    color: '#000',
  },
  terms: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: Colors.textMuted,
    textAlign: 'center',
    marginTop: Spacing.lg,
  },
});
