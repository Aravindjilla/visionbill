import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable,
  Modal, TextInput, Alert, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';
import api from '../utils/api';
import { Colors } from '../theme/colors';
import { Spacing } from '../theme/spacing';
import { Typography } from '../theme/typography';
import { GlassCard } from '../components/GlassCard';

interface BalanceSummary {
  counterpartyName: string;
  counterpartyMobile: string;
  netAmount: number;
  transactionCount: number;
}

interface HistoryEntry {
  _id: string;
  counterpartyName: string;
  amount: number;
  description: string;
  isSettled: boolean;
  createdAt: string;
}

export const SettlementScreen = ({ navigation }: any) => {
  const queryClient = useQueryClient();
  const [settleModal, setSettleModal] = useState<BalanceSummary | null>(null);
  const [settleAmount, setSettleAmount] = useState('');
  const [historyModal, setHistoryModal] = useState<BalanceSummary | null>(null);

  const { data: balances = [], isLoading } = useQuery<BalanceSummary[]>({
    queryKey: ['settlement-balances'],
    queryFn: () => api.get('/split/settlement/balances').then(r => r.data),
  });

  const { data: history = [], isLoading: historyLoading } = useQuery<HistoryEntry[]>({
    queryKey: ['settlement-history', historyModal?.counterpartyMobile],
    queryFn: () =>
      api.get(`/split/settlement/history?mobile=${historyModal!.counterpartyMobile}`).then(r => r.data),
    enabled: !!historyModal,
  });

  const settleMutation = useMutation({
    mutationFn: (vars: { mobile: string; amount: number }) =>
      api.post('/split/settlement/settle', {
        counterpartyMobile: vars.mobile,
        amount: vars.amount,
      }),
    onSuccess: () => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      queryClient.invalidateQueries({ queryKey: ['settlement-balances'] });
      setSettleModal(null);
      setSettleAmount('');
    },
    onError: () => Alert.alert('Error', 'Failed to record settlement.'),
  });

  const handleSettle = () => {
    if (!settleModal) return;
    const amount = parseFloat(settleAmount);
    if (isNaN(amount) || amount <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid positive amount.');
      return;
    }
    settleMutation.mutate({ mobile: settleModal.counterpartyMobile, amount });
  };

  const owedToMe   = balances.filter(b => b.netAmount > 0);
  const iOwe       = balances.filter(b => b.netAmount < 0);
  const totalOwed  = owedToMe.reduce((s, b) => s + b.netAmount, 0);
  const totalIOwe  = iOwe.reduce((s, b) => s + Math.abs(b.netAmount), 0);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Pressable onPress={() => navigation.goBack()} style={{ marginRight: 16 }}>
            <Text style={{ fontSize: 24, color: Colors.text }}>←</Text>
          </Pressable>
          <View>
            <Text style={styles.title}>Balances</Text>
            <Text style={styles.subtitle}>Running ledger across all splits</Text>
          </View>
        </View>
      </View>

      {/* Summary row */}
      <View style={styles.summaryRow}>
        <GlassCard style={[styles.summaryCard, { marginRight: 8 }]}>
          <Text style={styles.summaryLabel}>They Owe You</Text>
          <Text style={[styles.summaryAmount, { color: Colors.success }]}>₹{totalOwed.toFixed(2)}</Text>
        </GlassCard>
        <GlassCard style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>You Owe</Text>
          <Text style={[styles.summaryAmount, { color: Colors.error }]}>₹{totalIOwe.toFixed(2)}</Text>
        </GlassCard>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
        {isLoading && (
          <ActivityIndicator color={Colors.primary} style={{ marginTop: 40 }} />
        )}

        {!isLoading && balances.length === 0 && (
          <Text style={styles.empty}>All settled up! No outstanding balances.</Text>
        )}

        {owedToMe.length > 0 && (
          <>
            <Text style={styles.sectionLabel}>Owed to You</Text>
            {owedToMe.map(b => (
              <BalanceCard
                key={b.counterpartyMobile}
                balance={b}
                onSettle={() => { setSettleModal(b); setSettleAmount(b.netAmount.toFixed(2)); }}
                onHistory={() => setHistoryModal(b)}
              />
            ))}
          </>
        )}

        {iOwe.length > 0 && (
          <>
            <Text style={[styles.sectionLabel, { marginTop: 24 }]}>You Owe</Text>
            {iOwe.map(b => (
              <BalanceCard
                key={b.counterpartyMobile}
                balance={b}
                onSettle={() => { setSettleModal(b); setSettleAmount(Math.abs(b.netAmount).toFixed(2)); }}
                onHistory={() => setHistoryModal(b)}
              />
            ))}
          </>
        )}
      </ScrollView>

      {/* Settle Modal */}
      <Modal visible={!!settleModal} transparent animationType="slide" onRequestClose={() => setSettleModal(null)}>
        <View style={styles.modalBg}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Record Settlement</Text>
              <Pressable onPress={() => setSettleModal(null)}>
                <Text style={{ fontSize: 20, color: Colors.textMuted }}>✕</Text>
              </Pressable>
            </View>
            <View style={styles.form}>
              <Text style={styles.modalSubtitle}>
                Settling with <Text style={{ color: Colors.primary }}>{settleModal?.counterpartyName}</Text>
              </Text>
              <TextInput
                style={styles.input}
                placeholder="Amount (₹)"
                placeholderTextColor={Colors.textMuted}
                keyboardType="decimal-pad"
                value={settleAmount}
                onChangeText={setSettleAmount}
              />
              <Pressable
                style={[styles.submitBtn, settleMutation.isPending && { opacity: 0.6 }]}
                onPress={handleSettle}
                disabled={settleMutation.isPending}
              >
                <Text style={styles.submitBtnText}>
                  {settleMutation.isPending ? 'Saving...' : 'Mark as Settled'}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* History Modal */}
      <Modal visible={!!historyModal} transparent animationType="slide" onRequestClose={() => setHistoryModal(null)}>
        <View style={styles.modalBg}>
          <View style={[styles.modalContent, { maxHeight: '80%' }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{historyModal?.counterpartyName}</Text>
              <Pressable onPress={() => setHistoryModal(null)}>
                <Text style={{ fontSize: 20, color: Colors.textMuted }}>✕</Text>
              </Pressable>
            </View>
            {historyLoading ? (
              <ActivityIndicator color={Colors.primary} style={{ margin: 24 }} />
            ) : (
              <ScrollView style={{ padding: 24 }}>
                {history.length === 0 && (
                  <Text style={styles.empty}>No transactions yet.</Text>
                )}
                {history.map(h => (
                  <View key={h._id} style={styles.historyRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.historyDesc}>{h.description || 'Expense'}</Text>
                      <Text style={styles.historyDate}>{new Date(h.createdAt).toLocaleDateString()}</Text>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                      <Text style={[styles.historyAmount, { color: h.amount > 0 ? Colors.success : Colors.error }]}>
                        {h.amount > 0 ? '+' : ''}₹{Math.abs(h.amount).toFixed(2)}
                      </Text>
                      {h.isSettled && <Text style={styles.settledTag}>Settled</Text>}
                    </View>
                  </View>
                ))}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const BalanceCard = ({
  balance,
  onSettle,
  onHistory,
}: {
  balance: BalanceSummary;
  onSettle: () => void;
  onHistory: () => void;
}) => {
  const isPositive = balance.netAmount > 0;
  return (
    <View style={styles.balanceCard}>
      <View style={[styles.avatar, { backgroundColor: isPositive ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)' }]}>
        <Text style={styles.avatarText}>{balance.counterpartyName.charAt(0).toUpperCase()}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.counterpartyName}>{balance.counterpartyName}</Text>
        <Text style={styles.counterpartyMeta}>{balance.transactionCount} transaction{balance.transactionCount !== 1 ? 's' : ''}</Text>
      </View>
      <View style={{ alignItems: 'flex-end' }}>
        <Text style={[styles.netAmount, { color: isPositive ? Colors.success : Colors.error }]}>
          {isPositive ? '+' : '-'}₹{Math.abs(balance.netAmount).toFixed(2)}
        </Text>
        <View style={{ flexDirection: 'row', gap: 8, marginTop: 6 }}>
          <Pressable style={styles.historyBtn} onPress={onHistory}>
            <Text style={styles.historyBtnText}>History</Text>
          </Pressable>
          <Pressable style={styles.settleBtn} onPress={onSettle}>
            <Text style={styles.settleBtnText}>Settle</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.surface },
  header: { padding: Spacing.lg, paddingBottom: Spacing.md },
  title: { fontFamily: 'Outfit_700Bold', fontSize: 28, color: Colors.text },
  subtitle: { fontFamily: 'Inter_400Regular', fontSize: 13, color: Colors.textMuted, marginTop: 4 },
  summaryRow: { flexDirection: 'row', paddingHorizontal: Spacing.lg, marginBottom: 16 },
  summaryCard: { flex: 1, padding: 16 },
  summaryLabel: { ...Typography.tiny, color: Colors.textMuted },
  summaryAmount: { ...Typography.h2, marginTop: 4 },
  sectionLabel: { ...Typography.label, color: Colors.textMuted, paddingHorizontal: Spacing.lg, marginBottom: 8 },
  empty: { textAlign: 'center', color: Colors.textMuted, marginTop: 40, fontFamily: 'Inter_400Regular' },
  balanceCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.card, marginHorizontal: Spacing.lg,
    borderRadius: 16, marginBottom: 12, padding: 16,
    borderWidth: 1, borderColor: Colors.border,
  },
  avatar: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  avatarText: { ...Typography.subtitle, color: Colors.text },
  counterpartyName: { ...Typography.bodyBold, color: Colors.text },
  counterpartyMeta: { ...Typography.tiny, color: Colors.textMuted, marginTop: 2 },
  netAmount: { ...Typography.subtitle },
  settleBtn: { backgroundColor: Colors.primary, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  settleBtnText: { ...Typography.tiny, color: Colors.onPrimary, fontFamily: 'Inter_700Bold' },
  historyBtn: { backgroundColor: Colors.surfaceLight, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, borderWidth: 1, borderColor: Colors.border },
  historyBtnText: { ...Typography.tiny, color: Colors.text },
  // History row
  historyRow: { flexDirection: 'row', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: Colors.border },
  historyDesc: { ...Typography.bodySemibold, color: Colors.text },
  historyDate: { ...Typography.tiny, color: Colors.textMuted, marginTop: 2 },
  historyAmount: { ...Typography.subtitle },
  settledTag: { ...Typography.tiny, color: Colors.success, marginTop: 2 },
  // Modals
  modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: Colors.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingBottom: 40 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', padding: 24, borderBottomWidth: 1, borderBottomColor: Colors.border },
  modalTitle: { ...Typography.h3, color: Colors.text },
  modalSubtitle: { ...Typography.body, color: Colors.textMuted, marginBottom: 16 },
  form: { padding: 24 },
  input: { backgroundColor: Colors.card, padding: 16, borderRadius: 12, borderWidth: 1, borderColor: Colors.border, color: Colors.text, fontFamily: 'Inter_600SemiBold', marginBottom: 16 },
  submitBtn: { backgroundColor: Colors.primary, padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 8 },
  submitBtnText: { color: Colors.onPrimary, ...Typography.bodyBold },
});
