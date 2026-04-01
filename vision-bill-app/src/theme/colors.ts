import { useColorScheme } from 'react-native';
import { useThemeStore } from '../store/useThemeStore';

export const DarkTheme = {
  // ... rest of DarkTheme stays same ...
  primary: '#6366F1',
  onPrimary: '#FFFFFF',
  surface: '#0F1117',
  surfaceLight: '#1A1D27',
  surfaceDark: '#08090D',
  card: 'rgba(26, 29, 39, 0.7)',
  glassPrimary: 'rgba(99, 102, 241, 0.1)',
  glassSuccess: 'rgba(16, 185, 129, 0.1)',
  glassError: 'rgba(239, 68, 68, 0.1)',
  text: '#FFFFFF',
  textMuted: '#94A3B8',
  success: '#10B981',
  error: '#EF4444',
  border: '#1E293B',
  shimmer: '#1E293B',
  info: '#6366F1',
  warning: '#F59E0B',
  chart1: '#6366F1',
  chart2: '#10B981',
  accent: '#A855F7',
  overlay: 'rgba(0,0,0,0.2)',
};

export const LightTheme = {
  // ... rest of LightTheme stays same ...
  primary: '#4F46E5', // Slightly darker indigo for visibility
  onPrimary: '#FFFFFF',
  surface: '#F8FAFC',
  surfaceLight: '#FFFFFF',
  surfaceDark: '#E2E8F0',
  card: '#FFFFFF', // Solid card for light mode
  glassPrimary: 'rgba(79, 70, 229, 0.08)',
  glassSuccess: 'rgba(22, 163, 74, 0.1)',
  glassError: 'rgba(220, 38, 38, 0.1)',
  text: '#0F172A',
  textMuted: '#64748B',
  success: '#16A34A',
  error: '#DC2626',
  border: '#E2E8F0',
  shimmer: '#F1F5F9',
  info: '#4F46E5',
  warning: '#D97706',
  chart1: '#4F46E5',
  chart2: '#16A34A',
  accent: '#9333EA',
  overlay: 'rgba(0,0,0,0.2)',
};

export const Colors = DarkTheme;

export const useTheme = () => {
  const { theme } = useThemeStore();
  const systemScheme = useColorScheme();
  
  const currentTheme = theme === 'auto' ? systemScheme : theme;
  return currentTheme === 'light' ? LightTheme : DarkTheme;
};

