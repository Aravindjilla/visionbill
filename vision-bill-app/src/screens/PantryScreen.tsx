import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, ScrollView, Animated, RefreshControl, LayoutAnimation, Dimensions, Modal, ActivityIndicator, TextInput, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, useTheme } from '../theme/colors';
import { Spacing } from '../theme/spacing';
import { Shimmer } from '../components/Shimmer';
import { ErrorView } from '../components/ErrorView';
import { useQuery } from '@tanstack/react-query';
import api from '../utils/api';

const { width } = Dimensions.get('window');

import { LineChart } from 'react-native-chart-kit';
import { EmptyState } from '../components/EmptyState';

export const PantryScreen = () => {
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const theme = useTheme();

  // Recipe State
  const [recipeModalVisible, setRecipeModalVisible] = useState(false);
  const [recipesLoading, setRecipesLoading] = useState(false);
  const [recipes, setRecipes] = useState<any[]>([]);

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

  const filteredItems = searchQuery.trim()
    ? pantryItems.filter((item: any) =>
        item.cleanName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.category?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : pantryItems;

  const getTendency = (item: any) => {
    if (!item.lastPrice || item.currentPrice === item.lastPrice) return 'stable';
    return item.currentPrice > item.lastPrice ? 'up' : 'down';
  };

  const getChangePercent = (item: any) => {
    if (!item.lastPrice) return '0%';
    const pct = ((item.currentPrice - item.lastPrice) / item.lastPrice) * 100;
    return `${pct > 0 ? '+' : ''}${pct.toFixed(1)}%`;
  };

  const isPriceSpike = (item: any) => {
    if (!item.lastPrice) return false;
    const pct = ((item.currentPrice - item.lastPrice) / item.lastPrice) * 100;
    return pct > 15; // 15% threshold for fraud/hike alert
  };

  const renderTrendIcon = (tendency: string) => {
    if (tendency === 'up') return <Text style={{ color: theme.error }}>▲</Text>;
    if (tendency === 'down') return <Text style={{ color: theme.success }}>▼</Text>;
    return <Text style={{ color: theme.textMuted }}>━</Text>;
  };

  const loadRecipes = async () => {
    setRecipeModalVisible(true);
    setRecipesLoading(true);
    try {
      const resp = await api.post('/pantry/recipes');
      setRecipes(resp.data);
    } catch (e) {
      console.error(e);
      Alert.alert('Recipe Error', 'Could not load recipes. Check your connection and try again.');
    } finally {
      setRecipesLoading(false);
    }
  };

  const injectDemoData = async () => {
    try {
      await api.post('/scans/demo-seed');
      refetch();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.surface }]} edges={['top']}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.text }]}>Digital Pantry</Text>
        <Text style={[styles.subtitle, { color: theme.textMuted }]}>Track price-hikes on your daily staples</Text>
      </View>

      <View style={[styles.searchBar, { borderColor: theme.border, backgroundColor: theme.card }]}>
        <TextInput
          style={[styles.searchInput, { color: theme.text }]}
          placeholder="Search staples..."
          placeholderTextColor={theme.textMuted}
          value={searchQuery}
          onChangeText={setSearchQuery}
          returnKeyType="search"
          clearButtonMode="while-editing"
        />
      </View>

      {loading ? (
        <View style={{ paddingHorizontal: Spacing.lg }}>
          {[1, 2, 3, 4, 5, 6].map(i => (
            <Shimmer key={i} width={'100%'} height={82} style={{ marginBottom: 12, borderRadius: 16 }} />
          ))}
        </View>
      ) : filteredItems.length > 0 ? (
        <FlatList
          data={filteredItems}
          keyExtractor={item => item._id}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => refetch()} />
          }
          renderItem={({ item }) => {
            const tendency = getTendency(item);
            return (
              <Pressable 
                style={[styles.itemCard, { backgroundColor: theme.card, borderColor: theme.border }, selectedItem?._id === item._id && { borderColor: theme.primary, backgroundColor: theme.glassPrimary }]}
                onPress={() => {
                  LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                  setSelectedItem(item);
                }}
              >
                <View style={styles.itemMain}>
                  <View style={[styles.itemIcon, { backgroundColor: theme.border }]}><Text>{item.category === 'Veggies' ? '🍅' : (item.category === 'Dairy' ? '🥛' : '📦')}</Text></View>
                  <View>
                    <Text style={[styles.itemName, { color: theme.text }]} numberOfLines={1} ellipsizeMode="tail">{item.cleanName}</Text>
                    <Text style={[styles.itemUnit, { color: theme.textMuted }]}>{item.unit || 'unit'}</Text>
                  </View>
                </View>

                {/* Sparkline integration */}
                {item.priceHistory?.length > 1 && (
                  <View style={styles.sparklineContainer}>
                    <LineChart
                      data={{
                        labels: [],
                        datasets: [{ data: item.priceHistory.slice(-5).map((h: any) => Number(h.price)) }]
                      }}
                      width={80}
                      height={40}
                      chartConfig={{
                        backgroundColor: 'transparent',
                        backgroundGradientFrom: 'transparent',
                        backgroundGradientTo: 'transparent',
                        color: (opacity = 1) => item.currentPrice > (item.lastPrice || 0) ? `rgba(239, 68, 68, ${opacity})` : `rgba(16, 185, 129, ${opacity})`,
                        propsForDots: { r: "0" }
                      }}
                      withDots={false}
                      withInnerLines={false}
                      withOuterLines={false}
                      withVerticalLines={false}
                      withHorizontalLines={false}
                      bezier
                      style={{ paddingRight: 0, paddingLeft: 0 }}
                    />
                  </View>
                )}

                <View style={styles.itemRight}>
                  {isPriceSpike(item) && (
                    <View style={[styles.spikeBadge, { backgroundColor: theme.glassError }]}>
                      <Text style={[styles.spikeText, { color: theme.error }]}>🚨 Hike Alert</Text>
                    </View>
                  )}
                  <Text style={[styles.itemPrice, { color: theme.text }]}>₹{item.currentPrice}</Text>
                  <View style={styles.tendencyRow}>
                    {renderTrendIcon(tendency)}
                    <Text style={[styles.tendencyText, { color: tendency === 'up' ? theme.error : (tendency === 'down' ? theme.success : theme.textMuted) }]}>
                      {tendency === 'stable' ? 'Stable' : getChangePercent(item)}
                    </Text>
                  </View>
                </View>
              </Pressable>
            );
          }}
          contentContainerStyle={styles.listContent}
        />
      ) : (
        <EmptyState 
          icon="📦" 
          title="Digital Pantry is empty" 
          subtitle="All items from your scanned receipts will automatically appear here to track price hikes." 
          lottieUrl="https://lottie.host/e660995c-7d5d-4f81-8b2b-6899f8d660e1/p8D960aX8U.json"
          actionLabel="Try with Sample Receipt"
          onAction={injectDemoData}
        />
      )}

      {selectedItem && (
        <View style={[styles.detailDrawer, { backgroundColor: theme.card }]}>
          <View style={styles.drawerHeader}>
            <Text style={styles.detailTitle}>{selectedItem.cleanName}</Text>
            <Pressable onPress={() => setSelectedItem(null)}><Text style={styles.closeBtn}>✕</Text></Pressable>
          </View>
          
          <Text style={styles.chartTitle}>Price History (Trend)</Text>
          <View style={styles.chartWrapper}>
             {selectedItem.priceHistory?.length > 1 ? (
               <LineChart
                 data={{
                   labels: selectedItem.priceHistory.slice(-5).map((h: any) => new Date(h.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })),
                   datasets: [{ data: selectedItem.priceHistory.slice(-5).map((h: any) => Number(h.price)) }]
                 }}
                 width={width - 48}
                 height={140}
                 chartConfig={{
                   backgroundColor: theme.card,
                   backgroundGradientFrom: theme.card,
                   backgroundGradientTo: theme.card,
                   decimalPlaces: 0,
                   color: (opacity = 1) => `rgba(99, 102, 241, ${opacity})`,
                   labelColor: (opacity = 1) => theme.textMuted,
                   style: { borderRadius: 16 },
                   propsForDots: { r: "4", strokeWidth: "2", stroke: theme.primary }
                 }}
                 bezier
                 style={{ marginVertical: 8, borderRadius: 16 }}
                 withInnerLines={false}
                 withOuterLines={false}
                 withVerticalLines={false}
                 withHorizontalLines={false}
               />
             ) : (
               <View style={styles.noHistory}><Text style={styles.noHistoryText}>Scan more bills to see trends!</Text></View>
             )}
          </View>
          <View style={styles.bestPriceRow}>
            <View style={[styles.bestPriceCard, { backgroundColor: theme.surface }]}>
              <Text style={[styles.bestLabel, { color: theme.textMuted }]}>Lowest Ever</Text>
              <Text style={styles.bestValue}>₹{Math.min(...selectedItem.priceHistory?.map((h: any) => h.price) || [selectedItem.currentPrice])}</Text>
            </View>
            <View style={[styles.bestPriceCard, { backgroundColor: theme.surface }]}>
              <Text style={[styles.bestLabel, { color: theme.textMuted }]}>Latest Date</Text>
              <Text style={[styles.bestValue, { color: theme.text }]}>{new Date(selectedItem.updatedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</Text>
            </View>
          </View>
        </View>
      )}

      {/* Suggest Recipe FAB */}
      {filteredItems.length > 0 && !selectedItem && (
        <Pressable style={[styles.fab, { backgroundColor: theme.primary }]} onPress={loadRecipes}>
          <Text style={styles.fabIcon}>👨‍🍳</Text>
          <Text style={styles.fabText}>Suggest Recipes</Text>
        </Pressable>
      )}

      <Modal visible={recipeModalVisible} animationType="slide" transparent={true} onRequestClose={() => setRecipeModalVisible(false)}>
        <View style={styles.modalBg}>
          <View style={[styles.modalContent, { backgroundColor: theme.surface }]}>
            <View style={[styles.modalHeader, { borderBottomColor: theme.border }]}>
               <Text style={[styles.modalTitle, { color: theme.text }]}>Smart Recipes</Text>
               <Pressable onPress={() => setRecipeModalVisible(false)}><Text style={[styles.closeBtn, { color: theme.textMuted }]}>✕</Text></Pressable>
            </View>
            {recipesLoading ? (
               <View style={{ padding: 40, alignItems: 'center' }}>
                 <ActivityIndicator size="large" color={theme.primary} />
                 <Text style={{ marginTop: 16, color: theme.text, fontFamily: 'Inter_400Regular' }}>Gemini is designing your menu based on your pantry...</Text>
               </View>
            ) : (
               <ScrollView style={{ paddingHorizontal: 20 }}>
                 {recipes.map((r, i) => (
                    <View key={i} style={[styles.recipeCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
                      <Text style={[styles.recipeTitle, { color: theme.text }]}>{r.title}</Text>
                      <Text style={[styles.recipeMeta, { color: theme.textMuted }]}>⏱ {r.time} • 📊 {r.difficulty}</Text>
                      <Text style={[styles.recipeSectionTitle, { color: theme.primary }]}>Ingredients</Text>
                      {r.ingredients.map((ing: string, i2: number) => <Text key={i2} style={[styles.recipeBulleted, { color: theme.text }]}>• {ing}</Text>)}
                      <Text style={[styles.recipeSectionTitle, { marginTop: 12, color: theme.primary }]}>Instructions</Text>
                      {r.instructions.map((ins: string, i2: number) => <Text key={i2} style={[styles.recipeBulleted, { color: theme.text }]}>{i2+1}. {ins}</Text>)}
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

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { padding: Spacing.lg },
  title: { fontFamily: 'Outfit_700Bold', fontSize: 28 },
  subtitle: { fontFamily: 'Inter_400Regular', fontSize: 13, marginTop: 4 },
  searchBar: { marginHorizontal: Spacing.lg, borderRadius: 12, marginBottom: 20, borderWidth: 1 },
  searchInput: { padding: 12, fontFamily: 'Inter_400Regular', fontSize: 14 },
  searchPlaceholder: { fontFamily: 'Inter_400Regular' },
  listContent: { paddingHorizontal: Spacing.lg },
  itemCard: { flexDirection: 'row', padding: 16, borderRadius: 16, marginBottom: 12, alignItems: 'center', justifyContent: 'space-between', borderWidth: 1 },
  itemCardActive: {  },
  itemMain: { flexDirection: 'row', alignItems: 'center', flex: 1.5 },
  sparklineContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  itemIcon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  itemName: { fontFamily: 'Inter_700Bold', fontSize: 16 },
  itemUnit: { fontFamily: 'Inter_400Regular', fontSize: 11 },
  itemRight: { alignItems: 'flex-end', flex: 0.8 },
  itemPrice: { fontFamily: 'Outfit_600SemiBold', fontSize: 18 },
  spikeBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, marginBottom: 4 },
  spikeText: { fontFamily: 'Inter_700Bold', fontSize: 9, textTransform: 'uppercase' },
  tendencyRow: { flexDirection: 'row', alignItems: 'center', marginTop: 2 },
  tendencyText: { fontSize: 10, marginLeft: 4, fontFamily: 'Inter_700Bold' },
  detailDrawer: { position: 'absolute', bottom: 0, left: 0, right: 0, borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 24, paddingBottom: 40, shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.2, shadowRadius: 10, elevation: 20 },
  detailTitle: { fontFamily: 'Outfit_700Bold', fontSize: 20, marginBottom: 16 },
  chartWrapper: { height: 100, justifyContent: 'center', marginBottom: 20 },
  miniChart: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', height: 80 },
  miniBar: { width: 30, borderRadius: 4 },
  noHistory: { height: 140, justifyContent: 'center', alignItems: 'center', borderRadius: 16, borderStyle: 'dashed', borderWidth: 1 },
  noHistoryText: { fontFamily: 'Inter_400Regular', fontSize: 13 },
  drawerHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  closeBtn: { fontSize: 20, padding: 4 },
  chartTitle: { fontFamily: 'Inter_600SemiBold', fontSize: 12, marginBottom: 8 },
  bestPriceRow: { flexDirection: 'row', justifyContent: 'space-between' },
  bestPriceCard: { flex: 1, padding: 16, borderRadius: 16, marginRight: 8, alignItems: 'center' },
  bestLabel: { fontFamily: 'Inter_400Regular', fontSize: 10 },
  bestValue: { fontFamily: 'Outfit_700Bold', fontSize: 20, marginTop: 4 },
  fab: { position: 'absolute', bottom: 40, right: 20, flexDirection: 'row', paddingVertical: 12, paddingHorizontal: 20, borderRadius: 24, alignItems: 'center', elevation: 6 },
  fabIcon: { fontSize: 20, marginRight: 8 },
  fabText: { fontFamily: 'Inter_700Bold', fontSize: 14, color: '#FFF' },
  modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modalContent: { borderTopLeftRadius: 32, borderTopRightRadius: 32, height: '85%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', padding: 24, borderBottomWidth: 1 },
  modalTitle: { fontFamily: 'Outfit_700Bold', fontSize: 22 },
  recipeCard: { padding: 20, borderRadius: 16, marginTop: 16, borderWidth: 1 },
  recipeTitle: { fontFamily: 'Outfit_700Bold', fontSize: 20 },
  recipeMeta: { fontFamily: 'Inter_400Regular', fontSize: 12, marginTop: 4, marginBottom: 16 },
  recipeSectionTitle: { fontFamily: 'Inter_700Bold', fontSize: 14, marginBottom: 8 },
  recipeBulleted: { fontFamily: 'Inter_400Regular', fontSize: 13, marginBottom: 4, lineHeight: 20 },
});
