import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, ScrollView, RefreshControl, Dimensions, Modal, ActivityIndicator, TextInput, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, useTheme } from '../theme/colors';
import { Spacing } from '../theme/spacing';
import { SCAN_CONFIG } from '../utils/constants';
import { Shimmer } from '../components/Shimmer';
import { ErrorView } from '../components/ErrorView';
import { useQuery } from '@tanstack/react-query';
import { MotiView, AnimatePresence } from 'moti';
import api from '../utils/api';
import * as Haptics from 'expo-haptics';
import { LineChart } from 'react-native-chart-kit';
import { EmptyState } from '../components/EmptyState';

const { width } = Dimensions.get('window');

export const PantryScreen = () => {
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const theme = useTheme();

  // Recipe State
  const [recipeModalVisible, setRecipeModalVisible] = useState(false);
  const [recipesLoading, setRecipesLoading] = useState(false);
  const [recipes, setRecipes] = useState<any[]>([]);
  
  // Edit State
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editName, setEditName] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

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
    return pct > SCAN_CONFIG.PRICE_SPIKE_THRESHOLD;
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
      Alert.alert('Recipe Error', 'Could not load recipes.');
    } finally {
      setRecipesLoading(false);
    }
  };

  const handleUpdateItem = async () => {
    if (!selectedItem?._id) return;
    setIsUpdating(true);
    try {
      await api.patch(`/pantry/${selectedItem._id}`, { cleanName: editName, category: editCategory });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      refetch();
      setEditModalVisible(false);
      setSelectedItem(null);
    } catch (e) {
      Alert.alert('Update Failed', 'Could not update item.');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteItem = () => {
    if (!selectedItem?._id) return;
    Alert.alert(
      'Delete Item',
      `Permanently remove "${selectedItem.cleanName}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            try {
              await api.delete(`/pantry/${selectedItem._id}`);
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              refetch();
              setSelectedItem(null);
            } catch (e) {
              Alert.alert('Delete Failed', 'Could not remove item.');
            }
          }
        }
      ]
    );
  };

  const injectDemoData = async () => {
    try {
      await api.post('/scans/demo-seed');
      refetch();
    } catch (e) {}
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.surface }]} edges={['top']}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.text }]}>Digital Pantry</Text>
        <Text style={[styles.subtitle, { color: theme.textMuted }]}>Track price-hikes on your daily staples</Text>
      </View>

      <View style={[styles.searchBar, { borderColor: theme.border, backgroundColor: theme.card }]}>
        <Text style={[styles.searchIcon, { color: theme.textMuted }]}>🔍</Text>
        <TextInput
          style={[styles.searchInput, { color: theme.text }]}
          placeholder="Search staples..."
          placeholderTextColor={theme.textMuted}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <Pressable onPress={() => setSearchQuery('')}>
            <Text style={[styles.searchClear, { color: theme.textMuted }]}>✕</Text>
          </Pressable>
        )}
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
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => refetch()} />}
          renderItem={({ item, index }) => {
            const tendency = getTendency(item);
            return (
              <MotiView
                from={{ opacity: 0, translateY: 12 }}
                animate={{ opacity: 1, translateY: 0 }}
                transition={{ type: 'spring', damping: 20, stiffness: 160, delay: Math.min(index * 40, 300) }}
              >
                <Pressable
                  style={[styles.itemCard, { backgroundColor: theme.card, borderColor: theme.border }, selectedItem?._id === item._id && { borderColor: theme.primary, backgroundColor: theme.glassPrimary }]}
                  onPress={() => {
                    setSelectedItem(item);
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }}
                >
                  <View style={styles.itemMain}>
                    <View style={[styles.itemIcon, { backgroundColor: theme.border }]}><Text>{item.category === 'Veggies' ? '🍅' : (item.category === 'Dairy' ? '🥛' : '📦')}</Text></View>
                    <View>
                      <Text style={[styles.itemName, { color: theme.text }]}>{item.cleanName}</Text>
                      <Text style={[styles.itemUnit, { color: theme.textMuted }]}>{item.unit || 'unit'}</Text>
                    </View>
                  </View>
                  <View style={styles.itemRight}>
                    {isPriceSpike(item) && <View style={[styles.spikeBadge, { backgroundColor: theme.glassError }]}><Text style={[styles.spikeText, { color: theme.error }]}>🚨 Hike</Text></View>}
                    <Text style={[styles.itemPrice, { color: theme.text }]}>₹{item.currentPrice}</Text>
                    <View style={styles.tendencyRow}>
                      {renderTrendIcon(tendency)}
                      <Text style={[styles.tendencyText, { color: tendency === 'up' ? theme.error : theme.success }]}>{tendency === 'stable' ? 'Stable' : getChangePercent(item)}</Text>
                    </View>
                  </View>
                </Pressable>
              </MotiView>
            );
          }}
          contentContainerStyle={styles.listContent}
        />
      ) : (
        <EmptyState 
          icon="📦" 
          title="Digital Pantry is empty" 
          subtitle="Items from scanned receipts appear here." 
          lottieUrl="https://lottie.host/e660995c-7d5d-4f81-8b2b-6899f8d660e1/p8D960aX8U.json"
          actionLabel={__DEV__ ? "Try with Sample Receipt" : undefined}
          onAction={__DEV__ ? injectDemoData : undefined}
        />
      )}

      <AnimatePresence>
        {selectedItem && (
          <MotiView
            from={{ translateY: 300, opacity: 0 }}
            animate={{ translateY: 0, opacity: 1 }}
            exit={{ translateY: 300, opacity: 0 }}
            transition={{ type: 'spring', damping: 22, stiffness: 180 }}
            style={[styles.detailDrawer, { backgroundColor: theme.card }]}
          >
            <View style={styles.drawerHandle} />
            <View style={styles.drawerHeader}>
              <Text style={[styles.detailTitle, { color: theme.text }]}>{selectedItem.cleanName}</Text>
              <Pressable onPress={() => setSelectedItem(null)}>
                <Text style={[styles.closeBtn, { color: theme.textMuted }]}>✕</Text>
              </Pressable>
            </View>
            <View style={styles.bestPriceRow}>
              <View style={[styles.bestPriceCard, { backgroundColor: theme.surface }]}>
                <Text style={[styles.bestLabel, { color: theme.textMuted }]}>Lowest Ever</Text>
                <Text style={[styles.bestValue, { color: theme.success }]}>₹{Math.min(...selectedItem.priceHistory?.map((h: any) => h.price) || [selectedItem.currentPrice])}</Text>
              </View>
              <View style={[styles.bestPriceCard, { backgroundColor: theme.surface }]}>
                <Text style={[styles.bestLabel, { color: theme.textMuted }]}>Latest Price</Text>
                <Text style={[styles.bestValue, { color: theme.text }]}>₹{selectedItem.currentPrice}</Text>
              </View>
            </View>
            <View style={styles.manageRow}>
              <Pressable style={[styles.manageBtn, { backgroundColor: theme.surfaceDark }]} onPress={() => { setEditName(selectedItem.cleanName); setEditCategory(selectedItem.category); setEditModalVisible(true); }}>
                <Text style={[styles.manageBtnText, { color: theme.text }]}>✏️ Edit</Text>
              </Pressable>
              <Pressable style={[styles.manageBtn, { backgroundColor: theme.glassError }]} onPress={handleDeleteItem}>
                <Text style={[styles.manageBtnText, { color: theme.error }]}>🗑️ Delete</Text>
              </Pressable>
            </View>
          </MotiView>
        )}
      </AnimatePresence>

      {filteredItems.length > 0 && !selectedItem && (
        <Pressable style={[styles.fab, { backgroundColor: theme.primary }]} onPress={loadRecipes}>
          <Text style={styles.fabIcon}>👨‍🍳</Text>
          <Text style={styles.fabText}>Suggest Recipes</Text>
        </Pressable>
      )}

      <Modal visible={recipeModalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalBg}>
          <View style={[styles.modalContent, { backgroundColor: theme.surface }]}>
            <View style={[styles.modalHeader, { borderBottomColor: theme.border }]}>
               <Text style={[styles.modalTitle, { color: theme.text }]}>Smart Recipes</Text>
               <Pressable onPress={() => setRecipeModalVisible(false)}><Text style={[styles.closeBtn, { color: theme.textMuted }]}>✕</Text></Pressable>
            </View>
            {recipesLoading ? (
               <View style={{ padding: 40, alignItems: 'center' }}>
                 <ActivityIndicator size="large" color={theme.primary} />
                 <Text style={{ marginTop: 16, color: theme.text }}>Generating menu...</Text>
               </View>
            ) : (
               <ScrollView style={{ padding: 20 }}>
                 {recipes.map((r, i) => (
                    <View key={i} style={[styles.recipeCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
                      <Text style={[styles.recipeTitle, { color: theme.text }]}>{r.title}</Text>
                      <Text style={[styles.recipeMeta, { color: theme.textMuted }]}>{r.time} • {r.difficulty}</Text>
                      <Text style={[styles.recipeSectionTitle, { color: theme.primary }]}>Instructions</Text>
                      {r.instructions.map((ins: string, i2: number) => <Text key={i2} style={[styles.recipeBulleted, { color: theme.text }]}>{i2+1}. {ins}</Text>)}
                    </View>
                 ))}
               </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      <Modal visible={editModalVisible} animationType="fade" transparent={true}>
        <View style={styles.modalBg}>
          <View style={[styles.modalContent, { backgroundColor: theme.surface, height: 'auto', paddingBottom: 40 }]}>
            <View style={[styles.modalHeader, { borderBottomColor: theme.border }]}>
               <Text style={[styles.modalTitle, { color: theme.text }]}>Edit Item</Text>
               <Pressable onPress={() => setEditModalVisible(false)}><Text style={[styles.closeBtn, { color: theme.textMuted }]}>✕</Text></Pressable>
            </View>
            <View style={{ padding: 24 }}>
               <TextInput style={[styles.modalInput, { backgroundColor: theme.card, color: theme.text, borderColor: theme.border }]} value={editName} onChangeText={setEditName} placeholder="Item Name" />
               <TextInput style={[styles.modalInput, { backgroundColor: theme.card, color: theme.text, borderColor: theme.border, marginTop: 12 }]} value={editCategory} onChangeText={setEditCategory} placeholder="Category" />
               <Pressable style={[styles.saveBtn, { backgroundColor: theme.primary }, isUpdating && { opacity: 0.6 }]} onPress={handleUpdateItem} disabled={isUpdating}>
                 <Text style={styles.saveBtnText}>{isUpdating ? 'Saving...' : 'Update Details'}</Text>
               </Pressable>
            </View>
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
  searchBar: { marginHorizontal: Spacing.lg, borderRadius: 12, marginBottom: 20, borderWidth: 1, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12 },
  searchIcon: { fontSize: 16, marginRight: 8 },
  searchInput: { flex: 1, paddingVertical: 12, fontFamily: 'Inter_400Regular', fontSize: 14 },
  searchClear: { fontSize: 14, padding: 4 },
  listContent: { paddingHorizontal: Spacing.lg },
  itemCard: { flexDirection: 'row', padding: 16, borderRadius: 16, marginBottom: 12, alignItems: 'center', justifyContent: 'space-between', borderWidth: 1 },
  itemMain: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  itemIcon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  itemName: { fontFamily: 'Inter_700Bold', fontSize: 16 },
  itemUnit: { fontFamily: 'Inter_400Regular', fontSize: 11 },
  itemRight: { alignItems: 'flex-end' },
  itemPrice: { fontFamily: 'Outfit_600SemiBold', fontSize: 18 },
  spikeBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, marginBottom: 4 },
  spikeText: { fontFamily: 'Inter_700Bold', fontSize: 9, textTransform: 'uppercase' },
  tendencyRow: { flexDirection: 'row', alignItems: 'center', marginTop: 2 },
  tendencyText: { fontSize: 10, marginLeft: 4, fontFamily: 'Inter_700Bold' },
  detailDrawer: { position: 'absolute', bottom: 0, left: 0, right: 0, borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 24, paddingTop: 12, paddingBottom: 40, elevation: 20, shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.15, shadowRadius: 16 },
  drawerHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: 'rgba(150,150,150,0.3)', alignSelf: 'center', marginBottom: 16 },
  detailTitle: { fontFamily: 'Outfit_700Bold', fontSize: 20, marginBottom: 16 },
  drawerHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  closeBtn: { fontSize: 20, padding: 4 },
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
  recipeSectionTitle: { fontFamily: 'Inter_700Bold', fontSize: 14, marginBottom: 8, marginTop: 12 },
  recipeBulleted: { fontFamily: 'Inter_400Regular', fontSize: 13, marginBottom: 4, lineHeight: 20 },
  manageRow: { flexDirection: 'row', gap: 12, marginTop: 24 },
  manageBtn: { flex: 1, height: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  manageBtnText: { fontFamily: 'Inter_700Bold', fontSize: 14 },
  modalInput: { padding: 16, borderRadius: 12, borderWidth: 1, fontFamily: 'Inter_600SemiBold', fontSize: 15 },
  saveBtn: { height: 56, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginTop: 24 },
  saveBtnText: { color: '#FFF', fontFamily: 'Inter_800ExtraBold', fontSize: 16 },
});
