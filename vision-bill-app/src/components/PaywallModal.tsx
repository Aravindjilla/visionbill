import React from 'react';
import { View, Text, StyleSheet, Modal, Pressable, Dimensions, ActivityIndicator, Alert } from 'react-native';
import { Colors, useTheme } from '../theme/colors';
import { Typography } from '../theme/typography';
import { Spacing } from '../theme/spacing';
import { MotiView } from 'moti';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuthStore } from '../store/useAuthStore';
import { presentPaywall } from '../utils/revenuecat';

const { width } = Dimensions.get('window');

interface PaywallModalProps {
  visible: boolean;
  onClose: () => void;
  reason?: 'limit' | 'manual';
}

export const PaywallModal: React.FC<PaywallModalProps> = ({ visible, onClose, reason = 'manual' }) => {
  const theme = useTheme();
  const { scanLimit } = useAuthStore();
  const [purchasing, setPurchasing] = React.useState(false);

  const handlePurchase = async () => {
    setPurchasing(true);
    const success = await presentPaywall();
    setPurchasing(false);
    
    if (success) {
      // Sync with our backend + RC
      await useAuthStore.getState().refreshStatus();
      Alert.alert(
        '✨ Welcome to Pro!',
        'Your account has been upgraded. You now have unlimited scans and full access to all premium features.',
        [{ text: 'Start Exploring', onPress: onClose }]
      );
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <Pressable style={styles.dismissArea} onPress={onClose} />
        
        <MotiView
          from={{ scale: 0.9, opacity: 0, translateY: 50 }}
          animate={{ scale: 1, opacity: 1, translateY: 0 }}
          style={[styles.container, { backgroundColor: theme.card, borderColor: theme.border }]}
        >
          <LinearGradient
            colors={[theme.primary, '#9333ea']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.headerGradient}
          >
            <Text style={styles.headerEmoji}>✨</Text>
            <Text style={styles.headerTitle}>VisionBill Pro</Text>
          </LinearGradient>

          <View style={styles.content}>
            <Text style={[styles.title, { color: theme.text }]}>
              {reason === 'limit' ? "Monthly Limit Reached" : "Unlock the Full Experience"}
            </Text>
            <Text style={[styles.subtitle, { color: theme.textMuted }]}>
              {reason === 'limit' 
                ? `You've scanned ${scanLimit}/${scanLimit} bills this month. Upgrade to Pro for unlimited scanning and advanced tracking.` 
                : "Join thousands of users saving time and money with our premium ecosystem."}
            </Text>

            <View style={styles.features}>
              <FeatureItem icon="♾️" text="Unlimited Bill Scans" theme={theme} />
              <FeatureItem icon="🏠" text="Shared Household Pantries" theme={theme} />
              <FeatureItem icon="📊" text="Advanced Price Analytics" theme={theme} />
              <FeatureItem icon="📄" text="Export to Excel & PDF" theme={theme} />
            </View>

            <Pressable 
              style={[styles.mainBtn, { backgroundColor: theme.primary }, purchasing && { opacity: 0.7 }]}
              onPress={handlePurchase}
              disabled={purchasing}
            >
              {purchasing 
                ? <ActivityIndicator color={theme.onPrimary} />
                : <Text style={[styles.mainBtnText, { color: theme.onPrimary }]}>Get Pro for ₹49/month</Text>
              }
            </Pressable>

            <Pressable style={styles.secondaryBtn} onPress={onClose}>
              <Text style={[styles.secondaryBtnText, { color: theme.textMuted }]}>Maybe Later</Text>
            </Pressable>
          </View>
        </MotiView>
      </View>
    </Modal>
  );
};

const FeatureItem = ({ icon, text, theme }: any) => (
  <View style={styles.featureItem}>
    <Text style={styles.featureIcon}>{icon}</Text>
    <Text style={[styles.featureText, { color: theme.text }]}>{text}</Text>
  </View>
);

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center' },
  dismissArea: { ...StyleSheet.absoluteFillObject },
  container: { width: width * 0.85, borderRadius: 32, overflow: 'hidden', borderWidth: 1 },
  headerGradient: { padding: 32, alignItems: 'center' },
  headerEmoji: { fontSize: 40, marginBottom: 8 },
  headerTitle: { fontSize: 24, fontFamily: 'Outfit_700Bold', color: '#FFF' },
  content: { padding: 24, alignItems: 'center' },
  title: { fontSize: 20, fontFamily: 'Outfit_700Bold', textAlign: 'center', marginBottom: 12 },
  subtitle: { fontSize: 14, fontFamily: 'Inter_400Regular', textAlign: 'center', lineHeight: 20, marginBottom: 24 },
  features: { alignSelf: 'stretch', marginBottom: 32 },
  featureItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  featureIcon: { fontSize: 18, marginRight: 12 },
  featureText: { fontSize: 14, fontFamily: 'Inter_600SemiBold' },
  mainBtn: { alignSelf: 'stretch', padding: 16, borderRadius: 16, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8 },
  mainBtnText: { fontSize: 16, fontFamily: 'Inter_800ExtraBold' },
  secondaryBtn: { marginTop: 16, padding: 8 },
  secondaryBtnText: { fontSize: 13, fontFamily: 'Inter_600SemiBold' },
});
