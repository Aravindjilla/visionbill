import React from 'react';
import { View, Text, StyleSheet, Pressable, Image } from 'react-native';
import { MotiView, MotiText } from 'moti';
import * as Haptics from 'expo-haptics';
import { Colors } from '../theme/colors';
import { Spacing } from '../theme/spacing';

interface ItemCardProps {
  name: string;
  qty: string;
  price: number;
  savings?: number;
  imageUrl?: string;
  checked: boolean;
  onToggle: () => void;
}

export const ItemCard: React.FC<ItemCardProps> = ({
  name,
  qty,
  price,
  savings,
  imageUrl,
  checked,
  onToggle,
}) => {
  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onToggle();
  };

  return (
    <Pressable onPress={handlePress}>
      <MotiView
        animate={{
          opacity: checked ? 0.4 : 1,
          scale: checked ? 0.98 : 1,
        }}
        transition={{ type: 'spring', damping: 15 }}
        style={styles.container}
      >
        <View style={styles.left}>
          <View style={styles.imageContainer}>
            {imageUrl ? (
              <Image source={{ uri: imageUrl }} style={styles.image} />
            ) : (
              <MotiView
                from={{ opacity: 0.3 }}
                animate={{ opacity: 0.7 }}
                transition={{ loop: true, type: 'timing', duration: 1000 }}
                style={styles.shimmer}
              />
            )}
          </View>
        </View>

        <View style={styles.center}>
          <Text style={styles.name}>{name}</Text>
          <Text style={styles.qty}>{qty}</Text>
        </View>

        <View style={styles.right}>
          <Text style={styles.price}>₹{price.toFixed(2)}</Text>
          {savings && (
            <View style={styles.savingsBadge}>
              <Text style={styles.savingsText}>Save ₹{savings.toFixed(2)}</Text>
            </View>
          )}
        </View>

        <View style={styles.checkboxContainer}>
          <MotiView
            animate={{
              backgroundColor: checked ? Colors.success : 'transparent',
              borderColor: checked ? Colors.success : Colors.border,
            }}
            style={styles.checkbox}
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
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    padding: Spacing.md,
    borderRadius: 16,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  left: {
    marginRight: Spacing.md,
  },
  imageContainer: {
    width: 64,
    height: 64,
    borderRadius: 12,
    backgroundColor: Colors.shimmer,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  shimmer: {
    width: '100%',
    height: '100%',
    backgroundColor: Colors.textMuted,
  },
  center: {
    flex: 1,
  },
  name: {
    fontFamily: 'Inter_700Bold',
    fontSize: 16,
    color: Colors.text,
    marginBottom: 4,
  },
  qty: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: Colors.textMuted,
  },
  right: {
    alignItems: 'flex-end',
    marginRight: Spacing.sm,
  },
  price: {
    fontFamily: 'Inter_700Bold',
    fontSize: 16,
    color: Colors.text,
  },
  savingsBadge: {
    backgroundColor: 'rgba(0, 200, 83, 0.1)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 4,
  },
  savingsText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 10,
    color: Colors.success,
  },
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
