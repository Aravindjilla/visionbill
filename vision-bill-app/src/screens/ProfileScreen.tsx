import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, Pressable, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { Colors } from '../theme/colors';
import { Spacing } from '../theme/spacing';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../store/useAuthStore';
import api from '../utils/api';

export const ProfileScreen = () => {
  const queryClient = useQueryClient();
  const { userId, clearSession, accessToken } = useAuthStore();
  const [mobile, setMobile] = useState('');
  const [upiId, setUpiId] = useState('');

  const { data: user, isLoading: loading, refetch } = useQuery({
    queryKey: ['profile', userId],
    queryFn: async () => {
      if (!userId) return null;
      const resp = await api.get(`/users/profile/${userId}`);
      return resp.data;
    },
    enabled: !!userId && !!accessToken,
  });

  // Sync inputs when data arrives
  React.useEffect(() => {
    if (user) {
      setMobile(user.mobile || '');
      setUpiId(user.upiId || '');
    }
  }, [user]);

  const saveMutation = useMutation({
    mutationFn: (data: { mobile: string; upiId: string }) => 
      api.post(`/users/profile/${userId}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile', userId] });
      Alert.alert('Success', 'Profile updated successfully!');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    },
    onError: () => {
      Alert.alert('Error', 'Failed to update profile.');
    }
  });

  const handleSave = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    saveMutation.mutate({ mobile, upiId });
  };

  const handleLogout = async () => {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: async () => {
        await clearSession();
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }},
    ]);
  };

  const deleteMutation = useMutation({
    mutationFn: () => api.delete(`/users/${userId}`),
    onSuccess: () => {
      clearSession();
      Alert.alert('Account Wiped', 'Your data has been permanently deleted.');
    },
    onError: () => {
      Alert.alert('Error', 'Failed to delete account.');
    }
  });

  const handleDeleteAccount = async () => {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    Alert.alert(
      'Permanent Account Deletion',
      'This action is irreversible. All your scans, items, and profile data will be permanently wiped. Are you absolutely sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete Everything', 
          style: 'destructive', 
          onPress: () => deleteMutation.mutate()
        },
      ]
    );
  };

  if (loading) return null;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <View style={styles.avatarLarge}>
            <Text style={styles.avatarTextLarge}>{user?.displayName?.[0] || 'U'}</Text>
          </View>
          <Text style={styles.userName}>{user?.name || user?.displayName}</Text>
          <Text style={styles.userEmail}>{user?.email}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Payment Details</Text>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Mobile Number</Text>
            <TextInput
              style={styles.input}
              value={mobile}
              onChangeText={setMobile}
              placeholder="91xxxxxxxxxx"
              placeholderTextColor={Colors.textMuted}
              keyboardType="phone-pad"
            />
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>UPI ID (VPA)</Text>
            <TextInput
              style={styles.input}
              value={upiId}
              onChangeText={setUpiId}
              placeholder="username@upi"
              placeholderTextColor={Colors.textMuted}
              autoCapitalize="none"
            />
          </View>
        </View>

        <Pressable 
          style={[styles.saveButton, saveMutation.isPending && styles.saveButtonDisabled]} 
          onPress={handleSave}
          disabled={saveMutation.isPending}
        >
          <Text style={styles.saveButtonText}>{saveMutation.isPending ? 'Saving...' : 'Save Profile'}</Text>
        </Pressable>

        <View style={styles.dangerZone}>
          <Text style={styles.dangerTitle}>Danger Zone</Text>
          <Pressable 
            style={styles.logoutButton} 
            onPress={handleLogout}
          >
            <Text style={styles.logoutText}>Logout Session</Text>
          </Pressable>
          <Pressable 
            style={[styles.deleteButton, deleteMutation.isPending && { opacity: 0.5 }]} 
            onPress={handleDeleteAccount}
            disabled={deleteMutation.isPending}
          >
            <Text style={styles.deleteText}>{deleteMutation.isPending ? 'Deleting...' : 'Delete My Account Permanently'}</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.surface },
  scrollContent: { padding: Spacing.lg },
  header: { alignItems: 'center', marginBottom: 32 },
  avatarLarge: { width: 80, height: 80, borderRadius: 40, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  avatarTextLarge: { fontSize: 32, fontFamily: 'Outfit_700Bold', color: '#FFF' },
  userName: { fontSize: 24, fontFamily: 'Outfit_700Bold', color: Colors.text },
  userEmail: { fontSize: 14, fontFamily: 'Inter_400Regular', color: Colors.textMuted, marginTop: 4 },
  section: { backgroundColor: Colors.card, borderRadius: 20, padding: 20, marginBottom: 24 },
  sectionTitle: { fontSize: 16, fontFamily: 'Outfit_700Bold', color: Colors.text, marginBottom: 16 },
  inputGroup: { marginBottom: 16 },
  label: { fontSize: 13, fontFamily: 'Inter_600SemiBold', color: Colors.textMuted, marginBottom: 8 },
  input: { backgroundColor: Colors.surface, borderRadius: 12, padding: 12, color: Colors.text, fontFamily: 'Inter_400Regular', borderWidth: 1, borderColor: Colors.border },
  saveButton: { backgroundColor: Colors.primary, padding: 16, borderRadius: 16, alignItems: 'center' },
  saveButtonDisabled: { opacity: 0.6 },
  saveButtonText: { color: '#FFF', fontFamily: 'Inter_700Bold', fontSize: 16 },
  dangerZone: { marginTop: 40, borderTopWidth: 1, borderTopColor: Colors.border, paddingTop: 24 },
  dangerTitle: { fontSize: 16, fontFamily: 'Outfit_700Bold', color: Colors.error, marginBottom: 16 },
  logoutButton: { backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, padding: 16, borderRadius: 16, alignItems: 'center', marginBottom: 12 },
  logoutText: { color: Colors.text, fontFamily: 'Inter_600SemiBold', fontSize: 14 },
  deleteButton: { backgroundColor: 'transparent', padding: 16, borderRadius: 16, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(239, 68, 68, 0.3)' },
  deleteText: { color: Colors.error, fontFamily: 'Inter_600SemiBold', fontSize: 14 },
});
