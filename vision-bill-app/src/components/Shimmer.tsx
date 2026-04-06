import React from 'react';
import { View } from 'react-native';
import { Skeleton } from 'moti/skeleton';
import { useTheme } from '../theme/colors';
import { useThemeStore } from '../store/useThemeStore';
import { useColorScheme } from 'react-native';

interface ShimmerProps {
  width: number | string;
  height: number | string;
  borderRadius?: number;
  style?: any;
}

export const Shimmer = ({
  width,
  height,
  borderRadius = 12,
  style,
}: ShimmerProps) => {
  const theme = useTheme();
  const { theme: themeSetting } = useThemeStore();
  const systemScheme = useColorScheme();
  const resolved = themeSetting === 'auto' ? systemScheme : themeSetting;
  const colorMode: 'dark' | 'light' = resolved === 'light' ? 'light' : 'dark';

  return (
    <View style={style}>
      <Skeleton
        colorMode={colorMode}
        radius={borderRadius}
        height={height as any}
        width={width as any}
        colors={[theme.card, theme.border, theme.card]}
        transition={{
          type: 'timing',
          duration: 1200,
        }}
      />
    </View>
  );
};
