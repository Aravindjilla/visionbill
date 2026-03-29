import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Dimensions, RefreshControl, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, useTheme } from '../theme/colors';
import { Spacing } from '../theme/spacing';
import { Typography } from '../theme/typography';
import { GlassCard } from '../components/GlassCard';
import { Shimmer } from '../components/Shimmer';
import { ErrorView } from '../components/ErrorView';

const { width } = Dimensions.get('window');

import { useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../utils/api';
import { ProgressChart } from 'react-native-chart-kit';
import { AnimatePresence, MotiView, MotiText } from 'moti';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';

import { EmptyState } from '../components/EmptyState';
import { ExportService } from '../utils/export';
import { useScanStore } from '../store/useScanStore';
import { useAuthStore } from '../store/useAuthStore';
import { PaywallModal } from '../components/PaywallModal';
import { TourStep } from '../components/TourStep';

export const DashboardScreen = ({ navigation }: any) => {
  const queryClient = useQueryClient();
  const theme = useTheme();
  const [showAllReceipts, setShowAllReceipts] = useState(false);
  const { setScan, lastDeleted, setLastDeleted } = useScanStore();
  const { userId, tier, monthlyScanCount } = useAuthStore();

  const [undoVisible, setUndoVisible] = useState(false);
  const [offline, setOffline] = useState(false);
  const [paywallVisible, setPaywallVisible] = useState(false);
  const [paywallReason, setPaywallReason] = useState<'limit' | 'manual'>('manual');

  const pickImageGallery = async () => {
    if (tier === 'free' && (monthlyScanCount || 0) >= 5) {
      setPaywallReason('limit');
      setPaywallVisible(true);
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });

    if (!result.canceled) {
      // Navigate to Scanner with the image to reuse its processing logic
      navigation.navigate('Scanner', { imageFromGallery: result.assets[0] });
    }
  };

  const handleExportCSV = async (receipts: any[]) => {
    const exportData = receipts.map(r => ({
      Date: new Date(r.createdAt).toLocaleDateString(),
      Store: r.storeName || 'Unknown',
      Items: r.items?.length || 0,
      Total: r.extractedTotal?.toFixed(2) || 0,
      Status: r.status
    }));
    await ExportService.exportToCSV(exportData, `VisionBill_Export_${Date.now()}`);
  };

  const handleExportPDF = async (receipts: any[]) => {
    if (receipts.length === 0) return;
    const latest = receipts[0];
    const html = ExportService.generateReceiptHTML(latest);
    await ExportService.exportToPDF(html, `VisionBill_Receipt_${latest._id}`);
  };

  const handleUndo = async () => {
    if (!lastDeleted?._id) return;
    try {
      await api.post(`/scans/${lastDeleted._id}/restore`);
      setUndoVisible(false);
      setLastDeleted(null);
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (err) {
      Alert.alert('Restoration Failed', 'Could not restore the scan.');
    }
  };

  const handleDeleteScan = (id: string) => {
    const scanToDelete = recentReceipts.find((r: any) => r._id === id);
    Alert.alert(
      'Delete Scan',
      'Move this scan to trash?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.delete(`/scans/${id}`);
              setLastDeleted(scanToDelete);
              setUndoVisible(true);
              setTimeout(() => setUndoVisible(false), 5000); // 5s to undo
              queryClient.invalidateQueries({ queryKey: ['dashboard'] });
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            } catch (err) {
              Alert.alert('Error', 'Failed to delete scan.');
            }
          }
        }
      ]
    );
  };

  const injectDemoData = async () => {
    try {
      await api.post('/scans/demo-seed');
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    } catch (err) {
      console.error(err);
    }
  };

  const handleReceiptPress = (scan: any) => {
    if (scan.status !== 'completed') return;
    setScan(scan);
    navigation.navigate('Verification');
  };

  const { data, isLoading, isError, refetch, isRefetching } = useQuery({
    queryKey: ['dashboard', showAllReceipts],
    queryFn: async () => {
      const scansUrl = showAllReceipts ? '/scans' : '/scans?limit=5';
      const profilePromise = userId ? api.get(`/users/profile/${userId}`).catch(() => ({ data: {} })) : Promise.resolve({ data: {} });
      const [statsResp, scansResp, trendResp, profileResp] = await Promise.all([
        api.get('/pantry/stats'),
        api.get(scansUrl),
        api.get('/pantry/weekly-trend'),
        profilePromise,
      ]);

      const trend: { day: string; total: number }[] = trendResp.data;
      const savings: number = statsResp.data.savings || 0;
      const itemCount: number = statsResp.data.itemCount || 0;
      const scansThisWeek = trend.filter(d => d.total > 0).length;

      // Compute week-over-week spending direction from first 3 vs last 3 days of trend
      const first3 = trend.slice(0, 3).reduce((a, d) => a + d.total, 0);
      const last3 = trend.slice(-3).reduce((a, d) => a + d.total, 0);
      const spentChangePct = first3 > 0 ? Math.round(((last3 - first3) / first3) * 100) : 0;
      const spentChangeStr = spentChangePct >= 0 ? `+${spentChangePct}%` : `${spentChangePct}%`;

        return {
          stats: [
            { label: 'Total Spent', value: `₹${statsResp.data.totalSpent?.toFixed(0) || 0}`, change: spentChangeStr, pos: spentChangePct <= 0 },
            { label: 'Saved', value: `₹${savings.toFixed(0)}`, change: `${Math.min(Math.round(savings / 500 * 100), 100)}% goal`, pos: true },
            { label: 'Items', value: `${itemCount}`, change: `${scansThisWeek} scans`, pos: true },
          ],
          profile: profileResp.data,
          recentReceipts: scansResp.data,
          byCategory: statsResp.data.byCategory || {},
          weeklyTrend: trend,
          badges: (statsResp.data.badges || []) as { emoji: string; label: string }[],
          savingsGoal: profileResp.data.savingsGoal ?? 500,
        };
      },
    // Poll every 5s when any scan is still processing (functional form avoids init-order issue)
    refetchInterval: (query) => {
      const receipts: any[] = query.state.data?.recentReceipts ?? [];
      return receipts.some(r => r.status === 'processing' || r.status === 'pending') ? 5000 : false;
    },
  });

  if (isError) {
    return <ErrorView onRetry={() => refetch()} />;
  }

  const loading = isLoading && !data;
  const refreshing = isRefetching;
  const stats = data?.stats || [];
  const recentReceipts = data?.recentReceipts || [];
  const byCategory = data?.byCategory || {};
  const weeklyTrend: { day: string; total: number }[] = data?.weeklyTrend || Array.from({ length: 7 }, (_, i) => ({ day: ['S','M','T','W','T','F','S'][i], total: 0 }));
  const savingsGoal: number = data?.savingsGoal ?? 500;
  const savedAmount = parseFloat(data?.stats?.find((s: any) => s.label === 'Saved')?.value.replace('₹', '') || '0');

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  const namePrefix = data?.profile?.displayName || data?.profile?.name || 'User';
  const initials = namePrefix.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase();

  const openPaywall = (reason: 'limit' | 'manual' = 'manual') => {
    setPaywallReason(reason);
    setPaywallVisible(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
  };

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
            <Text style={[styles.welcomeText, { color: theme.textMuted }]}>{getGreeting()},</Text>
            <Text style={[styles.userName, { color: theme.text }]}>{namePrefix} 👋</Text>
            
            {/* Gamification Badges */}
            <View style={styles.gamificationRow}>
              <View style={[styles.badge, { backgroundColor: theme.card, borderColor: theme.border }]}><Text style={styles.badgeEmoji}>🔥</Text><Text style={[styles.badgeText, { color: theme.text }]}>3 Day Streak</Text></View>
              <View style={[styles.badge, styles.badgeGold, { backgroundColor: 'rgba(245, 158, 11, 0.1)' }]}><Text style={styles.badgeEmoji}>🏆</Text><Text style={[styles.badgeText, { color: theme.text }]}>Top Saver</Text></View>
            </View>

          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <View style={[styles.avatar, { backgroundColor: theme.primary }]}><Text style={[styles.avatarText, { color: theme.onPrimary }]}>{initials}</Text></View>
            <Pressable 
              style={[styles.walletBtn, { backgroundColor: theme.surfaceLight, borderColor: theme.border }]}
              onPress={() => navigation.navigate('LoyaltyWallet')}
            >
              <Text style={[styles.walletBtnText, { color: theme.text }]}>💳 Wallet</Text>
            </Pressable>
          </View>
        </View>

        {/* Stats Grid */}
        <View style={styles.statsRow}>
          {loading ? (
            [1, 2, 3].map(i => (
              <Shimmer key={i} width={(width - 40 - 16) / 3} height={90} borderRadius={20} />
            ))
          ) : (
            <TourStep id="stats-card" style={{ flexDirection: 'row', gap: 8 }}>
              {stats.map((s, i) => (
                <GlassCard key={i} style={styles.statCard}>
                  <Text style={[styles.statLabel, { color: theme.textMuted }]}>{s.label}</Text>
                  <Text style={[styles.statValue, { color: theme.text }]}>{s.value}</Text>
                  <Text style={[styles.statChange, { color: s.pos ? theme.success : theme.error }]}>
                    {s.change}
                  </Text>
                </GlassCard>
              ))}
            </TourStep>
          )}
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <TourStep id="scanner-btn" style={{ flex: 1 }}>
            <Pressable 
              style={[styles.actionBtn, { backgroundColor: theme.primary }]}
              onPress={() => navigation.navigate('Scanner')}
            >
              <Text style={[styles.actionBtnText, { color: theme.onPrimary }]}>📸 Scan Now</Text>
            </Pressable>
          </TourStep>
          <Pressable 
            style={[styles.actionBtn, { backgroundColor: theme.surfaceLight, borderColor: theme.border, borderWidth: 1 }]}
            onPress={pickImageGallery}
          >
            <Text style={[styles.actionBtnText, { color: theme.text }]}>🖼️ Upload Bill</Text>
          </Pressable>
        </View>

        {/* Insight Card: Trend */}
        <GlassCard style={styles.insightCard}>
          <View style={styles.insightHeader}>
            <Text style={styles.insightTitle}>Spending Trend</Text>
            <TourStep id="pantry-link">
              <Pressable onPress={() => navigation.navigate('Main', { screen: 'Pantry' })}>
                <Text style={styles.viewMore}>View Detail</Text>
              </Pressable>
            </TourStep>
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
            ) : (() => {
              const maxTotal = Math.max(...weeklyTrend.map(d => d.total), 1);
              return weeklyTrend.map((d, i) => {
                const barHeight = Math.max((d.total / maxTotal) * 100, 4);
                const isToday = i === weeklyTrend.length - 1;
                return (
                  <View key={i} style={styles.chartBarContainer}>
                    <View style={[styles.chartBar, { height: barHeight, opacity: isToday ? 1 : 0.55 }]} />
                    <Text style={styles.chartDate}>{d.day}</Text>
                  </View>
                );
              });
            })()}
          </View>
        </GlassCard>

        {/* Insight Card: Category Breakdown */}
        {!loading && Object.keys(byCategory).length > 0 && (
          <GlassCard style={styles.insightCard}>
            <Text style={[styles.insightTitle, { marginBottom: 16 }]}>Category Breakdown</Text>
            {Object.entries(byCategory).map(([cat, val]: [string, any]) => {
              const total = parseFloat(data?.stats?.find((s: any) => s.label === 'Total Spent')?.value.replace('₹', '') || '1');
              const pct = (val / total) * 100;
              return (
                <View key={cat} style={styles.catRow}>
                  <View style={styles.catInfo}>
                    <Text style={styles.catLabel}>{cat}</Text>
                    <Text style={styles.catValue}>₹{val.toFixed(0)}</Text>
                  </View>
                  <View style={styles.progressBarBg}>
                    <View style={[styles.progressBarFill, { width: `${Math.min(pct, 100)}%` }]} />
                  </View>
                </View>
              );
            })}
          </GlassCard>
        )}

        {/* Savings Progress Card */}
        {!loading && (
          <GlassCard style={styles.savingsCard}>
            <View style={styles.savingsInfo}>
              <Text style={styles.savingsTitle}>Total Savings This Month</Text>
              <Text style={styles.savingsAmount}>₹{savedAmount.toFixed(0)}</Text>
              <Text style={styles.savingsGoalText}>Goal: ₹{savingsGoal}</Text>
            </View>
            <ProgressChart
              data={{ data: [Math.min(savedAmount / savingsGoal, 1)] }}
              width={100}
              height={100}
              strokeWidth={8}
              radius={32}
              chartConfig={{
                backgroundColor: 'transparent',
                backgroundGradientFrom: 'transparent',
                backgroundGradientTo: 'transparent',
                color: (opacity = 1) => `rgba(16, 185, 129, ${opacity})`,
              }}
              hideLegend
            />
          </GlassCard>
        )}

        {/* Recent Receipts Section */}
        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>Recent Activity</Text>
            <View style={styles.exportActions}>
              <Pressable onPress={() => handleExportCSV(recentReceipts)} style={styles.exportBtn}>
                <Text style={styles.exportBtnText}>📄 CSV</Text>
              </Pressable>
              <Pressable onPress={() => handleExportPDF(recentReceipts)} style={styles.exportBtn}>
                <Text style={styles.exportBtnText}>📑 PDF Latest</Text>
              </Pressable>
            </View>
          </View>
          <Pressable onPress={() => navigation.navigate('ReceiptHistory')}>
            <Text style={styles.viewMore}>See All</Text>
          </Pressable>
        </View>

        {loading ? (
          <View style={{ paddingHorizontal: Spacing.lg }}>
            <Shimmer width={width - 40} height={80} borderRadius={16} style={{ marginBottom: 12 }} />
            <Shimmer width={width - 40} height={80} borderRadius={16} style={{ marginBottom: 12 }} />
          </View>
        ) : recentReceipts.length > 0 ? (
          recentReceipts.map((r: any) => (
            <Pressable
              key={r._id}
              style={styles.receiptCard}
              onPress={() => handleReceiptPress(r)}
              onLongPress={() => handleDeleteScan(r._id)}
            >
              <View style={styles.receiptIcon}>
                <Text style={styles.receiptIconText}>{r.billType === 'grocery' ? '🛒' : '🧾'}</Text>
              </View>
              <View style={styles.receiptMain}>
                <Text style={styles.storeName} numberOfLines={1} ellipsizeMode="tail">{r.storeName || 'New Scan'}</Text>
                <Text style={styles.receiptMeta}>{new Date(r.createdAt).toLocaleDateString()} • {r.items?.length || 0} items</Text>
              </View>
              <View style={styles.receiptRight}>
                <Text style={[styles.receiptAmount, { color: theme.text }]}>₹{r.extractedTotal?.toFixed(2) || '0.00'}</Text>
                <Text style={[styles.statusBadge, { color: r.status === 'completed' ? theme.success : theme.error }]}>
                  {r.status === 'completed' ? '✓' : '⏳'}
                </Text>
              </View>
            </Pressable>
          ))
        ) : (
          <EmptyState 
            icon="🧾" 
            title="No receipts yet" 
            subtitle="Scan your first bill to see spending insights and track your items." 
            lottieUrl="https://lottie.host/8e3172ca-635e-4686-a517-5e6e3cda83bc/X1Ld4A9H6p.json"
            actionLabel="Try with Sample Receipt"
            onAction={injectDemoData}
          />
        )}

        <View style={[styles.banner, { backgroundColor: theme.glassPrimary, borderColor: theme.primary }]}>
          <Text style={[styles.bannerTitle, { color: theme.primary }]}>Plan with VisionBill Premium</Text>
          <Text style={[styles.bannerDesc, { color: theme.text }]}>Unlock advanced price tracking and shared household pantries.</Text>
          <Pressable 
            style={[styles.upgradeBtn, { backgroundColor: theme.primary }]}
            onPress={() => openPaywall('manual')}
          >
            <Text style={[styles.upgradeBtnText, { color: theme.onPrimary }]}>Upgrade Now</Text>
          </Pressable>
        </View>
      </ScrollView>

      <PaywallModal 
        visible={paywallVisible} 
        onClose={() => setPaywallVisible(false)} 
        reason={paywallReason}
      />

      {/* Undo Snackbar */}
      <AnimatePresence>
        {undoVisible && (
          <MotiView
            from={{ translateY: 100, opacity: 0 }}
            animate={{ translateY: 0, opacity: 1 }}
            exit={{ translateY: 100, opacity: 0 }}
            style={[styles.undoSnackbar, { backgroundColor: theme.card, borderColor: theme.border }]}
          >
            <Text style={[styles.undoText, { color: theme.text }]}>Scan moved to trash</Text>
            <Pressable onPress={handleUndo} style={styles.undoBtn}>
              <Text style={styles.undoBtnText}>UNDO</Text>
            </Pressable>
          </MotiView>
        )}
      </AnimatePresence>

      {/* Offline Indicator */}
      {offline && (
        <View style={[styles.offlineBar, { backgroundColor: theme.error }]}>
          <Text style={styles.offlineText}>Offline Mode • Some features limited</Text>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingBottom: 100 },
  header: { padding: Spacing.lg, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  welcomeText: { ...Typography.caption },
  userName: { ...Typography.h1 },
  avatar: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  avatarText: { ...Typography.subtitle },
  gamificationRow: { flexDirection: 'row', marginTop: 12 },
  badge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, marginRight: 8, borderWidth: 1 },
  badgeGold: { borderColor: '#F59E0B' },
  badgeEmoji: { fontSize: 12, marginRight: 4 },
  badgeText: { ...Typography.tiny, fontFamily: 'Inter_600SemiBold' },
  walletBtn: { marginTop: 12, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, borderWidth: 1 },
  walletBtnText: { ...Typography.tiny, fontFamily: 'Inter_700Bold' },
  statsRow: { flexDirection: 'row', paddingHorizontal: Spacing.lg, justifyContent: 'space-between', marginBottom: 24 },
  statCard: { padding: 16, width: (width - 40 - 16) / 3 },
  statLabel: { ...Typography.tiny },
  statValue: { ...Typography.bodyBold, marginTop: 4 },
  statChange: { ...Typography.tiny, fontFamily: 'Inter_700Bold', marginTop: 2 },
  insightCard: { marginHorizontal: Spacing.lg, padding: 20, marginBottom: 24 },
  insightHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  insightTitle: { ...Typography.h3 },
  viewMore: { ...Typography.label, textTransform: 'none' },
  chartArea: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', height: 120, paddingBottom: 10 },
  chartBarContainer: { alignItems: 'center' },
  chartBar: { width: 12, borderRadius: 6, backgroundColor: '#6366F1' },
  chartDate: { ...Typography.tiny, marginTop: 10 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: Spacing.lg, marginBottom: 16 },
  sectionTitle: { ...Typography.h2 },
  receiptCard: { flexDirection: 'row', padding: 16, marginHorizontal: Spacing.lg, borderRadius: 16, marginBottom: 12, alignItems: 'center', borderWidth: 1 },
  receiptIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  receiptIconText: { fontSize: 20 },
  receiptMain: { flex: 1 },
  storeName: { ...Typography.bodyBold },
  receiptMeta: { ...Typography.caption, marginTop: 2 },
  receiptRight: { alignItems: 'flex-end' },
  receiptAmount: { ...Typography.subtitle },
  statusBadge: { ...Typography.tiny, marginTop: 4 },
  banner: { marginHorizontal: Spacing.lg, padding: 24, borderRadius: 24, borderStyle: 'dashed', borderWidth: 1, marginTop: 12 },
  bannerTitle: { ...Typography.h3 },
  bannerDesc: { ...Typography.caption, marginTop: 8, lineHeight: 18 },
  upgradeBtn: { alignSelf: 'flex-start', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 12, marginTop: 16 },
  upgradeBtnText: { ...Typography.label, textTransform: 'none' },
  catRow: { marginBottom: 16 },
  catInfo: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  catLabel: { ...Typography.bodySemibold },
  catValue: { ...Typography.subtitle },
  progressBarBg: { height: 8, borderRadius: 4, overflow: 'hidden' },
  progressBarFill: { height: '100%', borderRadius: 4 },
  exportActions: { flexDirection: 'row', marginTop: 8 },
  exportBtn: { borderWidth: 1, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, marginRight: 8 },
  exportBtnText: { ...Typography.tiny, fontFamily: 'Inter_600SemiBold' },
  savingsCard: { marginHorizontal: Spacing.lg, borderRadius: 24, padding: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 },
  savingsInfo: { flex: 1 },
  savingsTitle: { ...Typography.tiny },
  savingsAmount: { ...Typography.h2, marginTop: 4 },
  savingsGoalText: { ...Typography.captionSemibold, marginTop: 8 },
  undoSnackbar: { position: 'absolute', bottom: 30, left: 20, right: 20, padding: 16, borderRadius: 16, borderWidth: 1, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', elevation: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 },
  undoText: { fontFamily: 'Inter_600SemiBold', fontSize: 14 },
  undoBtn: { backgroundColor: '#6366F1', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  undoBtnText: { color: '#FFF', fontFamily: 'Inter_800ExtraBold', fontSize: 12 },
  offlineBar: { position: 'absolute', top: 0, left: 0, right: 0, padding: 4, alignItems: 'center' },
  offlineText: { color: '#FFF', fontSize: 10, fontFamily: 'Inter_700Bold' },
  quickActions: { flexDirection: 'row', paddingHorizontal: Spacing.lg, marginBottom: 24, gap: 12 },
  actionBtn: { flex: 1, height: 50, borderRadius: 16, justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 2 },
  actionBtnText: { fontSize: 14, fontFamily: 'Inter_700Bold' },
});
