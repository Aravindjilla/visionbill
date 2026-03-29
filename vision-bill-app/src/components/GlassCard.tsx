import React from 'react';
import { View, StyleSheet, ViewProps, ViewStyle } from 'react-native';
import { Colors } from '../theme/colors';

interface GlassCardProps extends ViewProps {
  children: React.ReactNode;
  style?: ViewStyle | ViewStyle[];
  intensity?: 'low' | 'medium' | 'high';
}

export const GlassCard = ({ children, style, intensity = 'medium', ...props }: GlassCardProps) => {
  const getIntensityStyle = () => {
    switch (intensity) {
      case 'low': return { backgroundColor: 'rgba(26, 29, 39, 0.4)' };
      case 'high': return { backgroundColor: 'rgba(26, 29, 39, 0.85)' };
      default: return { backgroundColor: Colors.card };
    }
  };

  return (
    <View 
      style={[
        styles.card, 
        getIntensityStyle(),
        style
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
    borderColor: 'rgba(255, 255, 255, 0.08)',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 4,
  },
});
