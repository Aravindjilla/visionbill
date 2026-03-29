import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, TextInput, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, useTheme } from '../theme/colors';
import { Spacing } from '../theme/spacing';
import { Typography } from '../theme/typography';
import { useQuery } from '@tanstack/react-query';
import api from '../utils/api';
import { useScanStore } from '../store/useScanStore';
import { Shimmer } from '../components/Shimmer';

export const ReceiptHistoryScreen = ({ navigation }: any) => {
  const theme = useTheme();
  const { setScan } = useScanStore();
  const [search, setSearch] = useState('');

  const { data: receipts = [], isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['scans', 'all'],
    queryFn: async () => {
      const resp = await api.get('/scans');
      return resp.data;
    }
  });

  const filtered = receipts.filter((r: any) => 
    (r.storeName || 'New Scan').toLowerCase().includes(search.toLowerCase())
  );

  const handlePress = (r: any) => {
    if (r.status !== 'completed') return;
    setScan(r);
    navigation.navigate('Verification');
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.surface }]}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={{ fontSize: 24, color: theme.text }}>←</Text>
        </Pressable>
        <Text style={[styles.title, { color: theme.text }]}>Scan History</Text>
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
          renderItem={({ item: r }) => (
            <Pressable 
              style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}
              onPress={() => handlePress(r)}
            >
              <View style={styles.iconBg}><Text style={{ fontSize: 20 }}>{r.billType === 'grocery' ? '🛒' : '🧾'}</Text></View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.storeName, { color: theme.text }]}>{r.storeName || 'New Scan'}</Text>
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
  iconBg: { width: 44, height: 44, borderRadius: 12, backgroundColor: 'rgba(99,102,241,0.1)', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  storeName: { ...Typography.bodyBold },
  meta: { ...Typography.tiny, marginTop: 2 },
  amount: { ...Typography.subtitle },
});
