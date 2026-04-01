import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import LottieView from 'lottie-react-native';
import { Colors, useTheme } from '../theme/colors';
import { Spacing } from '../theme/spacing';

interface EmptyStateProps {
  icon: string;
  title: string;
  subtitle: string;
  /** Prefer this over lottieUrl — pass require('../../assets/animations/file.json') */
  lottieSource?: any;
  /** Legacy CDN URL fallback (causes network fetch on every mount — use lottieSource instead) */
  lottieUrl?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ icon, title, subtitle, lottieSource, lottieUrl, actionLabel, onAction }) => {
  const theme = useTheme();
  const [lottieError, setLottieError] = useState(false);

  const resolvedSource = lottieSource ?? (lottieUrl ? { uri: lottieUrl } : null);

  return (
    <View style={styles.container}>
      <View style={[styles.iconCircle, { backgroundColor: theme.card, borderColor: theme.border }]}>
        {resolvedSource && !lottieError ? (
          <LottieView
            source={resolvedSource}
            autoPlay
            loop
            style={{ width: 120, height: 120 }}
            onAnimationFailure={() => setLottieError(true)}
          />
        ) : (
          <Text style={styles.icon}>{icon}</Text>
        )}
      </View>
      <Text style={[styles.title, { color: theme.text }]}>{title}</Text>
      <Text style={[styles.subtitle, { color: theme.textMuted }]}>{subtitle}</Text>
      
      {actionLabel && onAction && (
        <Pressable 
          style={[styles.actionBtn, { backgroundColor: theme.primary }]} 
          onPress={onAction}
        >
          <Text style={[styles.actionText, { color: theme.onPrimary }]}>{actionLabel}</Text>
        </Pressable>
      )}
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
  actionBtn: {
    marginTop: 24,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  actionText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 14,
  },
});
