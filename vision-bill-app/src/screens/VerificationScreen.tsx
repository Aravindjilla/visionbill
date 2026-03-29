import React from 'react';
import { View, Text, StyleSheet, SectionList, Pressable, ScrollView, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { Colors } from '../theme/colors';
import { Spacing } from '../theme/spacing';
import { ItemCard } from '../components/ItemCard';
import { Shimmer } from '../components/Shimmer';
import { useScanStore } from '../store/useScanStore';

export const VerificationScreen = ({ navigation }: any) => {
  const { items, toggleItem, loading, loadingMessage, currentScan } = useScanStore();
  const imageUrl = currentScan?.imageUrl;

  const groupedItems = items.reduce((acc: any[], item, index) => {
    const sectionIndex = acc.findIndex(s => s.title === item.category);
    if (sectionIndex > -1) {
      acc[sectionIndex].data.push({ ...item, originalIndex: index });
    } else {
      acc.push({ title: item.category, data: [{ ...item, originalIndex: index }] });
    }
    return acc;
  }, []);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>{loadingMessage || 'Analyzing Bill...'}</Text>
          <Text style={styles.subtitle}>Gemini is working its magic ✨</Text>
        </View>
        <ScrollView style={{ paddingHorizontal: Spacing.lg }}>
          {/* Skeleton for Image Preview */}
          <Shimmer width={'100%'} height={240} style={{ borderRadius: 24, marginBottom: 24 }} />
          {[1, 2, 3].map(i => (
            <Shimmer key={i} width={'100%'} height={80} style={{ marginBottom: 12, borderRadius: 16 }} />
          ))}
        </ScrollView>
      </SafeAreaView>
    );
  }


  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Verify Items</Text>
        <Text style={styles.subtitle}>{items.length} items found</Text>
      </View>

      <SectionList
        sections={groupedItems}
        keyExtractor={(item, index) => item.shorthand + index}
        ListHeaderComponent={() => (
          <View style={styles.imageHeader}>
            <Image 
              source={{ uri: imageUrl || 'https://via.placeholder.com/400x600' }} 
              style={styles.stitchedImage}
              resizeMode="contain"
            />
            <View style={styles.imageOverlay}>
              <Text style={styles.imageHint}>Stitched Receipt View</Text>
            </View>
          </View>
        )}
        renderItem={({ item }) => (
          <ItemCard
            name={item.cleanName}
            qty={item.qty > 1 ? `${item.qty} pcs` : '1 unit'}
            price={item.price}
            checked={item.checked}
            onToggle={() => toggleItem(item.originalIndex)}
          />
        )}
        renderSectionHeader={({ section: { title } }) => (
          <Text style={styles.sectionHeader}>{title}</Text>
        )}
        contentContainerStyle={styles.listContent}
        stickySectionHeadersEnabled={false}
      />

      <View style={styles.footer}>
        <Pressable 
          style={styles.splitButton}
          onPress={async () => {
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            navigation.navigate('Split');
          }}
        >
          <Text style={styles.splitButtonText}>Split with Friends</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.surface,
  },
  header: {
    padding: Spacing.lg,
  },
  title: {
    fontFamily: 'Outfit_700Bold',
    fontSize: 28,
    color: Colors.text,
  },
  subtitle: {
    fontFamily: 'Inter_400Regular',
    fontSize: 16,
    color: Colors.textMuted,
    marginTop: 4,
  },
  imageHeader: {
    marginHorizontal: Spacing.lg,
    height: 240,
    backgroundColor: Colors.card,
    borderRadius: 24,
    overflow: 'hidden',
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  stitchedImage: {
    width: '100%',
    height: '100%',
  },
  imageOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingVertical: 4,
    alignItems: 'center',
  },
  imageHint: {
    color: '#FFF',
    fontSize: 10,
    fontFamily: 'Inter_600SemiBold',
  },
  sectionHeader: {
    fontFamily: 'Outfit_600SemiBold',
    fontSize: 18,
    color: Colors.primary,
    backgroundColor: Colors.surface,
    paddingVertical: Spacing.sm,
    marginTop: Spacing.md,
    marginBottom: Spacing.xs,
  },
  listContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: 100,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: Spacing.lg,
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  splitButton: {
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.md,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  splitButtonText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 18,
    color: '#FFF',
  },
});

