import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, ScrollView, Animated, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../theme/colors';
import { Spacing } from '../theme/spacing';
import { Shimmer } from '../components/Shimmer';
import { ErrorView } from '../components/ErrorView';
import { useQuery } from '@tanstack/react-query';
import api from '../utils/api';

export const PantryScreen = () => {
  const [selectedItem, setSelectedItem] = useState<any>(null);

  const { data: pantryItems = [], isLoading, isError, refetch, isRefetching } = useQuery({
    queryKey: ['pantry'],
    queryFn: async () => {
      const resp = await api.get('/pantry');
      return resp.data;
    },
  });

  if (isError) {
    return <ErrorView onRetry={() => refetch()} />;
  }

  const loading = isLoading && pantryItems.length === 0;
  const refreshing = isRefetching;

  const getTendency = (item: any) => {
    if (!item.lastPrice || item.currentPrice === item.lastPrice) return 'stable';
    return item.currentPrice > item.lastPrice ? 'up' : 'down';
  };

  const getChangePercent = (item: any) => {
    if (!item.lastPrice) return '0%';
    const pct = ((item.currentPrice - item.lastPrice) / item.lastPrice) * 100;
    return `${pct > 0 ? '+' : ''}${pct.toFixed(1)}%`;
  };

  const renderTrendIcon = (tendency: string) => {
    if (tendency === 'up') return <Text style={{ color: Colors.error }}>▲</Text>;
    if (tendency === 'down') return <Text style={{ color: Colors.success }}>▼</Text>;
    return <Text style={{ color: Colors.textMuted }}>━</Text>;
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Digital Pantry</Text>
        <Text style={styles.subtitle}>Track price-hikes on your daily staples</Text>
      </View>

      <View style={styles.searchBar}>
        <Text style={styles.searchPlaceholder}>Search staples...</Text>
      </View>

      {loading ? (
        <View style={{ paddingHorizontal: Spacing.lg }}>
          {[1, 2, 3, 4, 5, 6].map(i => (
            <Shimmer key={i} width={'100%'} height={82} style={{ marginBottom: 12, borderRadius: 16 }} />
          ))}
        </View>
      ) : (
        <FlatList
          data={pantryItems}
          keyExtractor={item => item._id}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => refetch()} />
          }
          renderItem={({ item }) => {
            const tendency = getTendency(item);
            return (
              <Pressable 
                style={[styles.itemCard, selectedItem?._id === item._id && styles.itemCardActive]}
                onPress={() => setSelectedItem(item)}
              >
                <View style={styles.itemMain}>
                  <View style={styles.itemIcon}><Text>{item.category === 'Veggies' ? '🍅' : (item.category === 'Dairy' ? '🥛' : '📦')}</Text></View>
                  <View>
                    <Text style={styles.itemName}>{item.cleanName}</Text>
                    <Text style={styles.itemUnit}>{item.unit || 'unit'}</Text>
                  </View>
                </View>
                <View style={styles.itemRight}>
                  <Text style={styles.itemPrice}>₹{item.currentPrice}</Text>
                  <View style={styles.tendencyRow}>
                    {renderTrendIcon(tendency)}
                    <Text style={[styles.tendencyText, { color: tendency === 'up' ? Colors.error : (tendency === 'down' ? Colors.success : Colors.textMuted) }]}>
                      {tendency === 'stable' ? 'Stable' : getChangePercent(item)}
                    </Text>
                  </View>
                </View>
              </Pressable>
            );
          }}
          contentContainerStyle={styles.listContent}
        />
      )}

      {selectedItem && (
        <View style={styles.detailDrawer}>
          <Text style={styles.detailTitle}>{selectedItem.cleanName} Price Trend</Text>
          <View style={styles.chartWrapper}>
             <View style={styles.miniChart}>
                {selectedItem.priceHistory?.map((h: any, i: number) => (
                  <View key={i} style={[styles.miniBar, { height: (h.price / selectedItem.currentPrice) * 80 }]} />
                ))}
             </View>
          </View>
          <View style={styles.bestPriceRow}>
            <View style={styles.bestPriceCard}>
              <Text style={styles.bestLabel}>Lowest Ever</Text>
              <Text style={styles.bestValue}>₹{Math.min(...selectedItem.priceHistory?.map((h: any) => h.price) || [selectedItem.currentPrice])}</Text>
            </View>
            <View style={styles.bestPriceCard}>
              <Text style={styles.bestLabel}>Latest Date</Text>
              <Text style={styles.bestValue}>{new Date(selectedItem.updatedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</Text>
            </View>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.surface },
  header: { padding: Spacing.lg },
  title: { fontFamily: 'Outfit_700Bold', fontSize: 28, color: Colors.text },
  subtitle: { fontFamily: 'Inter_400Regular', fontSize: 13, color: Colors.textMuted, marginTop: 4 },
  searchBar: { marginHorizontal: Spacing.lg, padding: 12, backgroundColor: Colors.card, borderRadius: 12, marginBottom: 20, borderWidth: 1, borderColor: Colors.border },
  searchPlaceholder: { color: Colors.textMuted, fontFamily: 'Inter_400Regular' },
  listContent: { paddingHorizontal: Spacing.lg },
  itemCard: { flexDirection: 'row', backgroundColor: Colors.card, padding: 16, borderRadius: 16, marginBottom: 12, alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderColor: Colors.border },
  itemCardActive: { borderColor: Colors.primary, backgroundColor: 'rgba(26, 115, 232, 0.05)' },
  itemMain: { flexDirection: 'row', alignItems: 'center' },
  itemIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.border, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  itemName: { fontFamily: 'Inter_700Bold', fontSize: 16, color: Colors.text },
  itemUnit: { fontFamily: 'Inter_400Regular', fontSize: 11, color: Colors.textMuted },
  itemRight: { alignItems: 'flex-end' },
  itemPrice: { fontFamily: 'Outfit_600SemiBold', fontSize: 18, color: Colors.text },
  tendencyRow: { flexDirection: 'row', alignItems: 'center', marginTop: 2 },
  tendencyText: { fontSize: 10, marginLeft: 4, fontFamily: 'Inter_700Bold' },
  detailDrawer: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: Colors.card, borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 24, paddingBottom: 40, shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.2, shadowRadius: 10, elevation: 20 },
  detailTitle: { fontFamily: 'Outfit_700Bold', fontSize: 20, color: Colors.text, marginBottom: 16 },
  chartWrapper: { height: 100, justifyContent: 'center', marginBottom: 20 },
  miniChart: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', height: 80 },
  miniBar: { width: 30, backgroundColor: Colors.info, borderRadius: 4 },
  bestPriceRow: { flexDirection: 'row', justifyContent: 'space-between' },
  bestPriceCard: { flex: 1, padding: 16, borderRadius: 16, backgroundColor: Colors.surface, marginRight: 8, alignItems: 'center' },
  bestLabel: { fontFamily: 'Inter_400Regular', fontSize: 10, color: Colors.textMuted },
  bestValue: { fontFamily: 'Outfit_700Bold', fontSize: 20, color: Colors.success, marginTop: 4 },
});

