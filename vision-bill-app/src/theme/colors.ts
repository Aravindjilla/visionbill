import { useColorScheme } from 'react-native';
import { useThemeStore } from '../store/useThemeStore';

export const DarkTheme = {
  primary: '#4ade80',    // Luminous Mint (Money/Growth)
  secondary: '#38bdf8',  // Sky Blue (Vision/Data)
  onPrimary: '#000000',
  surface: '#050505',    // Matte Obsidian
  surfaceLight: '#0f172a',
  surfaceDark: '#000000',
  card: 'rgba(15, 23, 42, 0.7)',
  glassPrimary: 'rgba(74, 222, 128, 0.1)',
  glassSuccess: 'rgba(74, 222, 128, 0.15)',
  glassError: 'rgba(248, 113, 113, 0.1)',
  text: '#FFFFFF',
  textMuted: '#94a3b8',
  success: '#4ade80',
  error: '#f87171',
  border: 'rgba(255, 255, 255, 0.08)',
  shimmer: '#1e293b',
  info: '#38bdf8',
  warning: '#fbbf24',
  chart1: '#4ade80',
  chart2: '#38bdf8',
  accent: '#6366f1',
  overlay: 'rgba(0,0,0,0.5)',
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

