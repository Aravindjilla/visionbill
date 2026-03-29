import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Dimensions, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../theme/colors';
import { Spacing } from '../theme/spacing';
import { Shimmer } from '../components/Shimmer';
import axios from 'axios';
import { ErrorView } from '../components/ErrorView';

const { width } = Dimensions.get('window');

import { useQuery, useQueryClient } from '@tanstack/react-query';

export const DashboardScreen = () => {
  const queryClient = useQueryClient();

  const { data, isLoading, isError, refetch, isRefetching } = useQuery({
    queryKey: ['dashboard'],
    queryFn: async () => {
      const [statsResp, scansResp] = await Promise.all([
        axios.get('http://localhost:3000/pantry/stats'),
        axios.get('http://localhost:3000/scans'),
      ]);

      return {
        stats: [
          { label: 'Total Spent', value: `₹${statsResp.data.totalSpent?.toFixed(0) || 0}`, change: '+0%', pos: false },
          { label: 'Saved', value: `₹${statsResp.data.savings?.toFixed(0) || 0}`, change: '0%', pos: true },
          { label: 'Items', value: `${statsResp.data.itemCount || 0}`, change: 'Pantry', pos: true },
        ],
        recentReceipts: scansResp.data,
      };
    },
  });

  if (isError) {
    return <ErrorView onRetry={() => refetch()} />;
  }

  const loading = isLoading && !data;
  const refreshing = isRefetching;
  const stats = data?.stats || [];
  const recentReceipts = data?.recentReceipts || [];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        contentContainerStyle={styles.scrollContent} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => refetch()} />
        }
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.welcomeText}>Good Morning,</Text>
            <Text style={styles.userName}>Aravind 👋</Text>
          </View>
          <View style={styles.avatar}><Text style={styles.avatarText}>AJ</Text></View>
        </View>

        {/* Stats Grid */}
        <View style={styles.statsRow}>
          {loading ? (
            [1, 2, 3].map(i => (
              <Shimmer key={i} width={(width - 40 - 16) / 3} height={90} borderRadius={20} />
            ))
          ) : (
            stats.map((s, i) => (
              <View key={i} style={styles.statCard}>
                <Text style={styles.statLabel}>{s.label}</Text>
                <Text style={styles.statValue}>{s.value}</Text>
                <Text style={[styles.statChange, { color: s.pos ? Colors.success : Colors.error }]}>
                  {s.change}
                </Text>
              </View>
            ))
          )}
        </View>

        {/* Insight Card */}
        <View style={styles.insightCard}>
          <View style={styles.insightHeader}>
            <Text style={styles.insightTitle}>Spending Trend</Text>
            <Pressable><Text style={styles.viewMore}>View Detail</Text></Pressable>
          </View>
          <View style={styles.chartArea}>
            {loading ? (
              [1, 2, 3, 4, 5, 6, 7].map(i => (
                <View key={i} style={styles.chartBarContainer}>
                  <Shimmer width={12} height={40 + Math.random() * 60} borderRadius={6} />
                  <View style={{ height: 10, width: 10, marginTop: 10 }}>
                    <Shimmer width={10} height={10} borderRadius={2} />
                  </View>
                </View>
              ))
            ) : (
              [40, 60, 30, 80, 50, 90, 70].map((h, i) => (
                <View key={i} style={styles.chartBarContainer}>
                  <View style={[styles.chartBar, { height: h }]} />
                  <Text style={styles.chartDate}>{['M', 'T', 'W', 'T', 'F', 'S', 'S'][i]}</Text>
                </View>
              ))
            )}
          </View>
        </View>

        {/* Recent Receipts Section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          <Pressable><Text style={styles.viewMore}>See All</Text></Pressable>
        </View>

        {loading ? (
          <View style={{ paddingHorizontal: Spacing.lg }}>
            <Shimmer width={width - 40} height={80} borderRadius={16} style={{ marginBottom: 12 }} />
            <Shimmer width={width - 40} height={80} borderRadius={16} style={{ marginBottom: 12 }} />
            <Shimmer width={width - 40} height={80} borderRadius={16} style={{ marginBottom: 12 }} />
          </View>
        ) : (
          recentReceipts.map(r => (
            <Pressable key={r._id} style={styles.receiptCard}>
              <View style={styles.receiptIcon}>
                <Text style={styles.receiptIconText}>{r.billType === 'grocery' ? '🛒' : '🍔'}</Text>
              </View>
              <View style={styles.receiptMain}>
                <Text style={styles.storeName}>{r.store || (r.billType?.charAt(0).toUpperCase() + r.billType?.slice(1))}</Text>
                <Text style={styles.receiptMeta}>{new Date(r.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })} • {r.items?.length || 0} items</Text>
              </View>
              <View style={styles.receiptRight}>
                <Text style={styles.receiptAmount}>₹{r.extractedTotal || 0}</Text>
                <Text style={[styles.statusBadge, { color: r.status === 'completed' ? Colors.success : Colors.error }]}>
                  {r.status === 'completed' ? '✓' : '!'}
                </Text>
              </View>
            </Pressable>
          ))
        )}

        <View style={styles.banner}>
          <Text style={styles.bannerTitle}>Plan with VisionBill Premium</Text>
          <Text style={styles.bannerDesc}>Unlock advanced price tracking and shared household pantries.</Text>
          <Pressable style={styles.upgradeBtn}><Text style={styles.upgradeBtnText}>Upgrade Now</Text></Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>

  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.surface },
  scrollContent: { paddingBottom: 100 },
  header: { padding: Spacing.lg, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  welcomeText: { fontFamily: 'Inter_400Regular', fontSize: 14, color: Colors.textMuted },
  userName: { fontFamily: 'Outfit_700Bold', fontSize: 24, color: Colors.text },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#FFF', fontFamily: 'Outfit_700Bold', fontSize: 18 },
  statsRow: { flexDirection: 'row', paddingHorizontal: Spacing.lg, justifyContent: 'space-between', marginBottom: 24 },
  statCard: { backgroundColor: Colors.card, padding: 16, borderRadius: 20, width: (width - 40 - 16) / 3, borderWidth: 1, borderColor: Colors.border },
  statLabel: { fontFamily: 'Inter_400Regular', fontSize: 11, color: Colors.textMuted },
  statValue: { fontFamily: 'Outfit_700Bold', fontSize: 16, color: Colors.text, marginTop: 4 },
  statChange: { fontFamily: 'Inter_700Bold', fontSize: 10, marginTop: 2 },
  insightCard: { backgroundColor: Colors.card, marginHorizontal: Spacing.lg, borderRadius: 24, padding: 20, marginBottom: 24, borderWidth: 1, borderColor: Colors.border },
  insightHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  insightTitle: { fontFamily: 'Outfit_700Bold', fontSize: 18, color: Colors.text },
  viewMore: { fontFamily: 'Inter_600SemiBold', fontSize: 12, color: Colors.primary },
  chartArea: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', height: 120, paddingBottom: 10 },
  chartBarContainer: { alignItems: 'center' },
  chartBar: { width: 12, backgroundColor: Colors.primary, borderRadius: 6 },
  chartDate: { color: Colors.textMuted, fontSize: 10, marginTop: 10, fontFamily: 'Inter_400Regular' },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: Spacing.lg, marginBottom: 16 },
  sectionTitle: { fontFamily: 'Outfit_700Bold', fontSize: 20, color: Colors.text },
  receiptCard: { flexDirection: 'row', padding: 16, backgroundColor: Colors.card, marginHorizontal: Spacing.lg, borderRadius: 16, marginBottom: 12, alignItems: 'center', borderWidth: 1, borderColor: Colors.border },
  receiptIcon: { width: 40, height: 40, borderRadius: 12, backgroundColor: Colors.border, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  receiptIconText: { fontSize: 20 },
  receiptMain: { flex: 1 },
  storeName: { fontFamily: 'Inter_700Bold', fontSize: 16, color: Colors.text },
  receiptMeta: { fontFamily: 'Inter_400Regular', fontSize: 12, color: Colors.textMuted, marginTop: 2 },
  receiptRight: { alignItems: 'flex-end' },
  receiptAmount: { fontFamily: 'Outfit_600SemiBold', fontSize: 16, color: Colors.text },
  statusBadge: { color: Colors.success, fontSize: 12, marginTop: 4 },
  banner: { marginHorizontal: Spacing.lg, padding: 24, backgroundColor: 'rgba(26, 115, 232, 0.1)', borderRadius: 24, borderStyle: 'dashed', borderWidth: 1, borderColor: Colors.primary, marginTop: 12 },
  bannerTitle: { fontFamily: 'Outfit_700Bold', fontSize: 18, color: Colors.primary },
  bannerDesc: { fontFamily: 'Inter_400Regular', fontSize: 13, color: Colors.text, marginTop: 8, lineHeight: 18 },
  upgradeBtn: { backgroundColor: Colors.primary, alignSelf: 'flex-start', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 12, marginTop: 16 },
  upgradeBtnText: { color: '#FFF', fontFamily: 'Inter_700Bold', fontSize: 12 },
});

