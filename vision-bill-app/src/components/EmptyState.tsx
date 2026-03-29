import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import LottieView from 'lottie-react-native';
import { Colors } from '../theme/colors';
import { Spacing } from '../theme/spacing';

interface EmptyStateProps {
  icon: string;
  title: string;
  subtitle: string;
  lottieUrl?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ icon, title, subtitle, lottieUrl }) => {
  return (
    <View style={styles.container}>
      <View style={styles.iconCircle}>
        {lottieUrl ? (
          <LottieView 
            source={{ uri: lottieUrl }} 
            autoPlay 
            loop 
            style={{ width: 120, height: 120 }} 
          />
        ) : (
          <Text style={styles.icon}>{icon}</Text>
        )}
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
    marginTop: 40,
  },
  iconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  icon: {
    fontSize: 48,
  },
  title: {
    fontFamily: 'Outfit_700Bold',
    fontSize: 20,
    color: Colors.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: Colors.textMuted,
    textAlign: 'center',
    lineHeight: 20,
  },
});
