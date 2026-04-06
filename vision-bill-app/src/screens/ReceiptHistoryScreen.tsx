import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, TextInput, RefreshControl, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, useTheme } from '../theme/colors';
import { Spacing } from '../theme/spacing';
import { Typography } from '../theme/typography';
import { useQuery, useInfiniteQuery } from '@tanstack/react-query';
import { ActivityIndicator } from 'react-native';
import api from '../utils/api';
import { useScanStore } from '../store/useScanStore';
import { Shimmer } from '../components/Shimmer';
import { ExportService } from '../utils/export';

export const ReceiptHistoryScreen = ({ navigation }: any) => {
  const theme = useTheme();
  const { setScan } = useScanStore();
  const [search, setSearch] = useState('');

  const { 
    data, 
    fetchNextPage, 
    hasNextPage, 
    isFetchingNextPage, 
    isLoading, 
    refetch, 
    isRefetching 
  } = useInfiniteQuery({
    queryKey: ['scans', 'infinite'],
    queryFn: async ({ pageParam = 1 }) => {
      const resp = await api.get(`/scans?page=${pageParam}&limit=15`);
      return resp.data;
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage: any[], allPages) => {
      return lastPage.length === 15 ? allPages.length + 1 : undefined;
    },
  });

  const receipts = data?.pages.flat() || [];

  const filtered = receipts.filter((r: any) => 
    (r.merchantName || 'New Scan').toLowerCase().includes(search.toLowerCase())
  );

  const handlePress = (r: any) => {
    if (r.status !== 'completed') return;
    setScan(r);
    navigation.navigate('Verification');
  };

  const handleExportCSV = async () => {
    try {
      const resp = await api.get('/scans');
      const allScans: any[] = resp.data;
      if (allScans.length === 0) {
        Alert.alert('Nothing to Export', 'No receipts found.');
        return;
      }
      const exportData = allScans.map(r => ({
        Date: new Date(r.createdAt).toLocaleDateString(),
        Store: r.merchantName || 'Unknown',
        Items: r.items?.length || 0,
        Total: r.extractedTotal?.toFixed(2) || '0.00',
        Status: r.status,
      }));
      await ExportService.exportToCSV(exportData, `VisionBill_History_${Date.now()}`);
    } catch (err: any) {
      Alert.alert('Export Failed', err?.message || 'Could not export receipts.');
    }
  };

  const handleExportPDF = async () => {
    try {
      const resp = await api.get('/scans');
      const allScans: any[] = resp.data;
      if (allScans.length === 0) {
        Alert.alert('Nothing to Export', 'No receipts found.');
        return;
      }
      const totalSpent = allScans.reduce((sum, r) => sum + (r.extractedTotal ?? 0), 0);
      const byCategory: Record<string, number> = {};
      allScans.forEach(r => {
        const cat = r.billType || 'Other';
        byCategory[cat] = (byCategory[cat] || 0) + (r.extractedTotal ?? 0);
      });
      const dateLabel = new Date().toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
      const html = ExportService.generateSummaryHTML(
        allScans,
        { totalSpent, byCategory, savings: 0 },
        dateLabel,
      );
      await ExportService.exportToPDF(html, `VisionBill_History_${Date.now()}`);
    } catch (err: any) {
      Alert.alert('Export Failed', err?.message || 'Could not generate PDF report.');
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.surface }]}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={{ fontSize: 24, color: theme.text }}>←</Text>
        </Pressable>
        <Text style={[styles.title, { color: theme.text }]}>Scan History</Text>
        <View style={styles.exportActions}>
          <Pressable onPress={handleExportCSV} style={[styles.exportBtn, { borderColor: theme.border }]}>
            <Text style={[styles.exportBtnText, { color: theme.textMuted }]}>📄 CSV</Text>
          </Pressable>
          <Pressable onPress={handleExportPDF} style={[styles.exportBtn, { borderColor: theme.border }]}>
            <Text style={[styles.exportBtnText, { color: theme.textMuted }]}>📑 PDF</Text>
          </Pressable>
        </View>
      </View>

      <View style={[styles.searchBar, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <TextInput 
          style={[styles.searchInput, { color: theme.text }]}
          placeholder="Search stores..."
          placeholderTextColor={theme.textMuted}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {isLoading ? (
        <View style={{ padding: 20 }}>
          {[1,2,3,4,5].map(i => <Shimmer key={i} width="100%" height={80} borderRadius={16} style={{ marginBottom: 12 }} />)}
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={r => r._id}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
          contentContainerStyle={{ padding: 20 }}
          onEndReached={() => hasNextPage && fetchNextPage()}
          onEndReachedThreshold={0.4}
          ListFooterComponent={() => isFetchingNextPage ? <ActivityIndicator size="small" color={theme.primary} style={{ margin: 20 }} /> : null}
          renderItem={({ item: r }) => (
            <Pressable 
              style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}
              onPress={() => handlePress(r)}
            >
              <View style={[styles.iconBg, { backgroundColor: theme.glassPrimary }]}><Text style={{ fontSize: 20 }}>{r.billType === 'grocery' ? '🛒' : '🧾'}</Text></View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.storeName, { color: theme.text }]}>{r.merchantName || 'New Scan'}</Text>
                <Text style={[styles.meta, { color: theme.textMuted }]}>{new Date(r.createdAt).toLocaleDateString()}</Text>
              </View>
              <Text style={[styles.amount, { color: theme.text }]}>₹{r.extractedTotal || '0'}</Text>
            </Pressable>
          )}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', padding: Spacing.lg },
  backBtn: { marginRight: 16 },
  title: { ...Typography.h2 },
  searchBar: { marginHorizontal: 20, borderRadius: 12, paddingHorizontal: 16, height: 48, justifyContent: 'center', borderWidth: 1, marginBottom: 10 },
  searchInput: { fontFamily: 'Inter_400Regular' },
  card: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 16, borderWidth: 1, marginBottom: 12 },
  iconBg: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  exportActions: { flexDirection: 'row', marginLeft: 'auto', gap: 8 },
  exportBtn: { borderWidth: 1, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  exportBtnText: { fontFamily: 'Inter_600SemiBold', fontSize: 11 },
  storeName: { ...Typography.bodyBold },
  meta: { ...Typography.tiny, marginTop: 2 },
  amount: { ...Typography.subtitle },
});
