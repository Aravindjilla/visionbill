import React from 'react';
import { View, StyleSheet } from 'react-native';
import { MotiView } from 'moti';
import { Skeleton } from 'moti/skeleton';
import { Colors } from '../theme/colors';

interface ShimmerProps {
  width: number | string;
  height: number | string;
  borderRadius?: number;
  style?: any;
  colorMode?: 'dark' | 'light';
}

export const Shimmer = ({ 
  width, 
  height, 
  borderRadius = 12, 
  style,
  colorMode = 'dark'
}: ShimmerProps) => {
  return (
    <View style={style}>
      <Skeleton
        colorMode={colorMode}
        radius={borderRadius}
        height={height as any}
        width={width as any}
        colors={[Colors.card, Colors.border, Colors.card]}
        transition={{
          type: 'timing',
          duration: 1500,
        }}
      />
    </View>
  );
};

