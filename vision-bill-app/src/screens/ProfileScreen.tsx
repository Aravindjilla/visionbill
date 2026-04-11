import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, Pressable, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { Colors, useTheme } from '../theme/colors';
import { Spacing } from '../theme/spacing';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../store/useAuthStore';
import api from '../utils/api';
import { SCREENS } from '../utils/constants';
import { Shimmer } from '../components/Shimmer';
import { useThemeStore } from '../store/useThemeStore';
import { presentCustomerCenter, logoutUser } from '../utils/revenuecat';
import { LinearGradient } from 'expo-linear-gradient';

export const ProfileScreen = ({ navigation }: any) => {
  const queryClient = useQueryClient();
  const theme = useTheme();
  const { userId, clearSession, accessToken } = useAuthStore();
  const [mobile, setMobile] = useState('');
  const [upiId, setUpiId] = useState('');
  const [savingsGoal, setSavingsGoal] = useState('500');

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
      setSavingsGoal(String(user.savingsGoal ?? 500));
    }
  }, [user]);

  const saveMutation = useMutation({
    mutationFn: (data: { mobile: string; upiId: string; savingsGoal: number }) =>
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
    saveMutation.mutate({ mobile, upiId, savingsGoal: parseFloat(savingsGoal) || 500 });
  };

  const handleLogout = async () => {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: async () => {
        await logoutUser();
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

  const themeStore = useThemeStore();

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.surface }]}>
        <View style={{ padding: 20 }}>
          <View style={{ alignItems: 'center', marginBottom: 32 }}>
            <Shimmer width={80} height={80} borderRadius={40} style={{ marginBottom: 16 }} />
            <Shimmer width={150} height={24} borderRadius={8} style={{ marginBottom: 8 }} />
            <Shimmer width={200} height={16} borderRadius={8} />
          </View>
          <Shimmer width="100%" height={240} borderRadius={20} style={{ marginBottom: 24 }} />
          <Shimmer width="100%" height={56} borderRadius={16} />
        </View>
      </SafeAreaView>
    );
  }

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

        <View style={[styles.section, { backgroundColor: theme.card, borderColor: theme.border, borderWidth: 1 }]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Appearance</Text>
          <View style={styles.themeRow}>
            {(['light', 'dark', 'auto'] as const).map((t) => (
              <Pressable
                key={t}
                style={[
                  styles.themeBtn,
                  { borderColor: theme.border, backgroundColor: themeStore.theme === t ? theme.primary : theme.surface },
                ]}
                onPress={() => {
                  themeStore.setTheme(t);
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }}
              >
                <Text style={[styles.themeBtnText, { color: themeStore.theme === t ? theme.onPrimary : theme.text }]}>
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        <View style={[styles.section, { backgroundColor: theme.card, borderColor: theme.border, borderWidth: 1 }]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Payment Details</Text>
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: theme.textMuted }]}>Mobile Number</Text>
            <TextInput
              style={[styles.input, { backgroundColor: theme.surface, color: theme.text, borderColor: theme.border }]}
              value={mobile}
              onChangeText={setMobile}
              placeholder="91xxxxxxxxxx"
              placeholderTextColor={theme.textMuted}
              keyboardType="phone-pad"
            />
          </View>
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: theme.textMuted }]}>UPI ID (VPA)</Text>
            <TextInput
              style={[styles.input, { backgroundColor: theme.surface, color: theme.text, borderColor: theme.border }]}
              value={upiId}
              onChangeText={setUpiId}
              placeholder="username@upi"
              placeholderTextColor={theme.textMuted}
              autoCapitalize="none"
            />
          </View>
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: theme.textMuted }]}>Monthly Savings Goal (₹)</Text>
            <TextInput
              style={[styles.input, { backgroundColor: theme.surface, color: theme.text, borderColor: theme.border }]}
              value={savingsGoal}
              onChangeText={setSavingsGoal}
              placeholder="500"
              placeholderTextColor={theme.textMuted}
              keyboardType="numeric"
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

        <Pressable
          style={styles.subscriptionsBtn}
          onPress={() => navigation.navigate(SCREENS.SUBSCRIPTIONS)}
        >
          <Text style={styles.subscriptionsBtnText}>📅 Manage External Subscriptions</Text>
        </Pressable>

        <Pressable
          style={[styles.subscriptionsBtn, { backgroundColor: theme.primary + '10', borderColor: theme.primary }]}
          onPress={presentCustomerCenter}
        >
          <Text style={[styles.subscriptionsBtnText, { color: theme.primary }]}>✨ Manage VisionBill Pro</Text>
        </Pressable>

        <Pressable
          style={[styles.subscriptionsBtn, { marginTop: 12 }]}
          onPress={() => navigation.navigate(SCREENS.PRIVACY)}
        >
          <Text style={styles.subscriptionsBtnText}>🛡️ Privacy & Security</Text>
        </Pressable>

        <Pressable
          style={[styles.subscriptionsBtn, { marginTop: 12 }]}
          onPress={() => navigation.navigate(SCREENS.TERMS)}
        >
          <Text style={styles.subscriptionsBtnText}>📄 Terms of Service</Text>
        </Pressable>

        <View style={[styles.section, { marginTop: 24, backgroundColor: theme.primary + '05', borderColor: theme.primary + '30', borderWidth: 1 }]}>
          <Text style={[styles.sectionTitle, { color: theme.primary }]}>Beta Tester Tools</Text>
          <Pressable
            style={[styles.saveButton, { backgroundColor: theme.primary + '20' }]}
            onPress={async () => {
              try {
                await api.post('/scans/demo-seed');
                queryClient.invalidateQueries();
                Alert.alert('Beta Success', 'Demo receipts and pantry items have been seeded for your account.');
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              } catch (err) {
                Alert.alert('Beta Error', 'Failed to seed demo data.');
              }
            }}
          >
            <Text style={[styles.saveButtonText, { color: theme.primary }]}>🌱 Seed Demo Data</Text>
          </Pressable>
          <Text style={[styles.label, { marginTop: 12, textAlign: 'center' }]}>Use this to populate your dashboard with sample data for testing.</Text>
        </View>

        <View style={[styles.dangerZone, { borderTopColor: theme.border }]}>
          <Text style={[styles.dangerTitle, { color: theme.error }]}>Danger Zone</Text>
          <Pressable 
            style={[styles.logoutButton, { backgroundColor: theme.surface, borderColor: theme.border }]} 
            onPress={handleLogout}
          >
            <Text style={[styles.logoutText, { color: theme.text }]}>Logout Session</Text>
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
  subscriptionsBtn: { marginTop: 16, borderWidth: 1, borderColor: Colors.border, borderRadius: 12, padding: 16, alignItems: 'center', backgroundColor: Colors.card },
  subscriptionsBtnText: { fontFamily: 'Inter_600SemiBold', fontSize: 14, color: Colors.text },
  dangerZone: { marginTop: 24, borderTopWidth: 1, borderTopColor: Colors.border, paddingTop: 24 },
  dangerTitle: { fontSize: 16, fontFamily: 'Outfit_700Bold', color: Colors.error, marginBottom: 16 },
  logoutButton: { backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, padding: 16, borderRadius: 16, alignItems: 'center', marginBottom: 12 },
  logoutText: { color: Colors.text, fontFamily: 'Inter_600SemiBold', fontSize: 14 },
  deleteButton: { backgroundColor: 'transparent', padding: 16, borderRadius: 16, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(239, 68, 68, 0.3)' },
  deleteText: { color: Colors.error, fontFamily: 'Inter_600SemiBold', fontSize: 14 },
  themeRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  themeBtn: { flex: 1, padding: 12, borderRadius: 12, alignItems: 'center', borderWidth: 1 },
  themeBtnText: { fontFamily: 'Inter_700Bold', fontSize: 13 },
});
