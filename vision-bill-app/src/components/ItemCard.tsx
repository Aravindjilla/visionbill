import React from 'react';
import { View, Text, StyleSheet, Pressable, Image, TextInput } from 'react-native';
import { MotiView, MotiText } from 'moti';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../theme/colors';
import { Spacing } from '../theme/spacing';

interface ItemCardProps {
  name: string;
  qty: string;
  price: number;
  savings?: number;
  imageUrl?: string;
  checked: boolean;
  isSplit?: boolean;
  onToggle: () => void;
  onPriceChange?: (newPrice: number) => void;
  onDelete?: () => void;
}

export const ItemCard = React.memo<ItemCardProps>(({
  name,
  qty,
  price,
  savings,
  imageUrl,
  checked,
  isSplit,
  onToggle,
  onPriceChange,
  onDelete,
}) => {
  const theme = useTheme();
  const [internalPrice, setInternalPrice] = React.useState(price.toString());
  
  // Keep internal price sync'd if external price changes
  React.useEffect(() => {
    setInternalPrice(price.toString());
  }, [price]);
  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onToggle();
  };

  const handleLongPress = () => {
    if (onDelete) {
      onDelete();
    }
  };

  return (
    <Pressable onPress={handlePress} onLongPress={handleLongPress}>
      <MotiView
        animate={{
          opacity: checked ? 0.4 : 1,
          scale: checked ? 0.98 : 1,
        }}
        transition={{ type: 'spring', damping: 15 }}
        style={[styles.container, { backgroundColor: theme.card, borderColor: theme.border }]}
      >
        {imageUrl && (
          <View style={styles.left}>
            <View style={[styles.imageContainer, { backgroundColor: theme.shimmer }]}>
              <Image source={{ uri: imageUrl }} style={styles.image} />
            </View>
          </View>
        )}

        <View style={styles.center}>
          <Text style={[styles.name, { color: theme.text }]}>{name}</Text>
          <View style={styles.qtyRow}>
            <Text style={[styles.qty, { color: theme.textMuted }]}>{qty}</Text>
            {isSplit && (
              <View style={[styles.splitBadge, { backgroundColor: theme.glassPrimary }]}>
                <Text style={[styles.splitBadgeText, { color: theme.primary }]}>⚡ Split</Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.right}>
          {onPriceChange ? (
            <View style={[styles.editPriceContainer, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <Text style={[styles.currencySymbol, { color: theme.textMuted }]}>₹</Text>
              <TextInput
                style={[styles.priceInput, { color: theme.text }]}
                value={internalPrice}
                onChangeText={setInternalPrice}
                keyboardType="decimal-pad"
                onEndEditing={(e) => {
                  const parsed = parseFloat(e.nativeEvent.text);
                  if (!isNaN(parsed) && onPriceChange) {
                    onPriceChange(parsed);
                  } else {
                    setInternalPrice(price.toString());
                  }
                }}
              />
            </View>
          ) : (
            <Text style={[styles.price, { color: theme.text }]}>₹{price.toFixed(2)}</Text>
          )}
          {savings && (
            <View style={[styles.savingsBadge, { backgroundColor: theme.glassSuccess }]}>
              <Text style={[styles.savingsText, { color: theme.success }]}>Save ₹{savings.toFixed(2)}</Text>
            </View>
          )}
        </View>

        <View style={styles.checkboxContainer}>
          <MotiView
            animate={{
              backgroundColor: checked ? theme.success : 'transparent',
              borderColor: checked ? theme.success : theme.border,
            }}
            style={[styles.checkbox, { borderColor: theme.border }]}
          >
            {checked && (
              <MotiText
                from={{ scale: 0 }}
                animate={{ scale: 1 }}
                style={styles.checkIcon}
              >
                ✓
              </MotiText>
            )}
          </MotiView>
        </View>
      </MotiView>
    </Pressable>
  );
});

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: 16,
    marginBottom: Spacing.sm,
    borderWidth: 1,
  },
  left: {
    marginRight: Spacing.md,
  },
  imageContainer: {
    width: 64,
    height: 64,
    borderRadius: 12,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  center: {
    flex: 1,
  },
  name: {
    fontFamily: 'Inter_700Bold',
    fontSize: 16,
    marginBottom: 4,
  },
  qty: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
  },
  right: {
    alignItems: 'flex-end',
    marginRight: Spacing.sm,
  },
  price: {
    fontFamily: 'Inter_700Bold',
    fontSize: 16,
  },
  editPriceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    borderWidth: 1,
  },
  currencySymbol: {
    fontFamily: 'Inter_700Bold',
    fontSize: 14,
    marginRight: 2,
  },
  priceInput: {
    fontFamily: 'Inter_700Bold',
    fontSize: 16,
    minWidth: 40,
    textAlign: 'right',
  },
  savingsBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 4,
  },
  savingsText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 10,
  },
  qtyRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  splitBadge: { backgroundColor: 'rgba(99,102,241,0.12)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  splitBadgeText: { fontFamily: 'Inter_700Bold', fontSize: 9, color: '#6366F1' },
  checkboxContainer: {
    marginLeft: Spacing.sm,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkIcon: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
});
