import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, Modal, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../theme/colors';
import { Spacing } from '../theme/spacing';
import { Typography } from '../theme/typography';
import { useSubscriptionStore, Subscription } from '../store/useSubscriptionStore';
import * as Haptics from 'expo-haptics';

export const SubscriptionsScreen = ({ navigation }: any) => {
  const { subscriptions, addSubscription, removeSubscription } = useSubscriptionStore();
  const [modalVisible, setModalVisible] = useState(false);
  const [newSub, setNewSub] = useState({ name: '', amount: '' });

  const totalMonthly = subscriptions.reduce((acc, sub) => acc + sub.amount, 0);

  const handleAdd = () => {
    if (!newSub.name || !newSub.amount) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    addSubscription({
      name: newSub.name,
      amount: parseFloat(newSub.amount),
      billingCycle: 'monthly',
      nextBillingDate: new Date(Date.now() + 86400000 * 30).toISOString(),
      color: Colors.primary
    });
    setModalVisible(false);
    setNewSub({ name: '', amount: '' });
  };

  const getDaysLeft = (dateStr: string) => {
    const diff = new Date(dateStr).getTime() - Date.now();
    const days = Math.ceil(diff / (1000 * 3600 * 24));
    return days > 0 ? `${days} days` : 'Today';
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Pressable onPress={() => navigation.goBack()} style={{ marginRight: 16 }}>
            <Text style={{ fontSize: 24, color: Colors.text }}>←</Text>
          </Pressable>
          <View>
            <Text style={styles.title}>Subscriptions</Text>
            <Text style={styles.subtitle}>₹{totalMonthly.toFixed(2)} / month</Text>
          </View>
        </View>
        <Pressable style={styles.addBtn} onPress={() => setModalVisible(true)}>
          <Text style={styles.addBtnText}>+ Add</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.list}>
        {subscriptions.map(sub => (
          <View key={sub.id} style={styles.subCard}>
            <View style={styles.subLeft}>
              <View style={[styles.subIcon, { backgroundColor: sub.color }]} />
              <View>
                <Text style={styles.subName}>{sub.name}</Text>
                <Text style={styles.subMeta}>Next billing in {getDaysLeft(sub.nextBillingDate)}</Text>
              </View>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={styles.subAmount}>₹{sub.amount.toFixed(2)}</Text>
              <Pressable onPress={() => removeSubscription(sub.id)}>
                <Text style={styles.deleteText}>Remove</Text>
              </Pressable>
            </View>
          </View>
        ))}
        {subscriptions.length === 0 && (
          <Text style={{ textAlign: 'center', color: Colors.textMuted, marginTop: 40, fontFamily: 'Inter_400Regular' }}>No subscriptions tracked yet.</Text>
        )}
      </ScrollView>

      <Modal visible={modalVisible} transparent={true} animationType="slide">
        <View style={styles.modalBg}>
          <View style={styles.modalContent}>
             <View style={styles.modalHeader}>
               <Text style={styles.modalTitle}>Track Subscription</Text>
               <Pressable onPress={() => setModalVisible(false)}><Text style={{ fontSize: 20, color: Colors.textMuted }}>✕</Text></Pressable>
             </View>
             <View style={styles.form}>
                <TextInput
                  style={styles.input}
                  placeholder="Service Name (e.g. Netflix)"
                  placeholderTextColor={Colors.textMuted}
                  value={newSub.name}
                  onChangeText={t => setNewSub({...newSub, name: t})}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Monthly Amount (₹)"
                  placeholderTextColor={Colors.textMuted}
                  keyboardType="decimal-pad"
                  value={newSub.amount}
                  onChangeText={t => setNewSub({...newSub, amount: t})}
                />
                <Pressable style={styles.submitBtn} onPress={handleAdd}>
                   <Text style={styles.submitBtnText}>Add to Tracker</Text>
                </Pressable>
             </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.surface },
  header: { padding: Spacing.lg, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { ...Typography.h2, color: Colors.text },
  subtitle: { ...Typography.caption, color: Colors.textMuted, marginTop: 4 },
  addBtn: { backgroundColor: 'rgba(99, 102, 241, 0.1)', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 12 },
  addBtnText: { ...Typography.label, color: Colors.primary },
  list: { paddingHorizontal: Spacing.lg },
  subCard: { flexDirection: 'row', backgroundColor: Colors.card, padding: 16, borderRadius: 16, marginBottom: 12, justifyContent: 'space-between', alignItems: 'center', borderWidth: 1, borderColor: Colors.border },
  subLeft: { flexDirection: 'row', alignItems: 'center' },
  subIcon: { width: 40, height: 40, borderRadius: 12, marginRight: 12 },
  subName: { ...Typography.bodyBold, color: Colors.text },
  subMeta: { ...Typography.tiny, color: Colors.textMuted, marginTop: 4 },
  subAmount: { ...Typography.subtitle, color: Colors.text },
  deleteText: { ...Typography.tiny, color: Colors.error, marginTop: 8 },
  modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: Colors.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingBottom: 40 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', padding: 24, borderBottomWidth: 1, borderBottomColor: Colors.border },
  modalTitle: { ...Typography.h3, color: Colors.text },
  form: { padding: 24 },
  input: { backgroundColor: Colors.card, padding: 16, borderRadius: 12, borderWidth: 1, borderColor: Colors.border, color: Colors.text, fontFamily: 'Inter_600SemiBold', marginBottom: 16 },
  submitBtn: { backgroundColor: Colors.primary, padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 8 },
  submitBtnText: { color: Colors.onPrimary, ...Typography.bodyBold }
});
