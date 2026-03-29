import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Colors } from '../theme/colors';
import { Spacing } from '../theme/spacing';

interface ErrorViewProps {
  message?: string;
  onRetry: () => void;
}

export const ErrorView = ({ message = 'Something went wrong', onRetry }: ErrorViewProps) => (
  <View style={styles.container}>
    <Text style={styles.icon}>⚠️</Text>
    <Text style={styles.message}>{message}</Text>
    <Pressable style={styles.button} onPress={onRetry}>
      <Text style={styles.buttonText}>Retry</Text>
    </Pressable>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: Spacing.xl },
  icon: { fontSize: 40, marginBottom: 16 },
  message: { fontFamily: 'Inter_400Regular', fontSize: 16, color: Colors.textMuted, textAlign: 'center', marginBottom: 24 },
  button: { backgroundColor: Colors.primary, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 },
  buttonText: { fontFamily: 'Inter_700Bold', color: '#FFF', fontSize: 14 },
});
