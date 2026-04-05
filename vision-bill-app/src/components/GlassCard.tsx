import React from 'react';
import { View, StyleSheet, ViewProps, ViewStyle } from 'react-native';
import { useTheme } from '../theme/colors';

interface GlassCardProps extends ViewProps {
  children: React.ReactNode;
  style?: ViewStyle | ViewStyle[];
  intensity?: 'low' | 'medium' | 'high';
}

export const GlassCard = ({ children, style, intensity = 'medium', ...props }: GlassCardProps) => {
  const theme = useTheme();

  const getIntensityStyle = (): ViewStyle => {
    switch (intensity) {
      case 'low':  return { backgroundColor: theme.surface };
      case 'high': return { backgroundColor: theme.surfaceLight };
      default:     return { backgroundColor: theme.card };
    }
  };

  return (
    <View
      style={[
        styles.card,
        { borderColor: theme.border },
        getIntensityStyle(),
        style,
      ]}
      {...props}
    >
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 24,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 4,
  },
});
