import React, { useState } from 'react';
import {
  View, Text, StyleSheet, Pressable, ScrollView,
  Dimensions, Modal, TextInput, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CameraView, useCameraPermissions } from 'expo-camera';
import QRCode from 'react-native-qrcode-svg';
import * as Haptics from 'expo-haptics';
import { Colors } from '../theme/colors';
import { Spacing } from '../theme/spacing';
import { Typography } from '../theme/typography';
import { useLoyaltyStore } from '../store/useLoyaltyStore';

const { width } = Dimensions.get('window');

export const LoyaltyWalletScreen = ({ navigation }: any) => {
  const { cards, addCard, removeCard } = useLoyaltyStore();
  const [activeCard, setActiveCard] = useState<string | null>(null);
  const [scannerVisible, setScannerVisible] = useState(false);
  const [manualVisible, setManualVisible] = useState(false);
  const [scanned, setScanned] = useState(false);
  const [storeName, setStoreName] = useState('');
  const [manualCode, setManualCode] = useState('');

  const [permission, requestPermission] = useCameraPermissions();

  const handleCardPress = (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setActiveCard(activeCard === id ? null : id);
  };

  const openScanner = async () => {
    if (!permission?.granted) {
      const result = await requestPermission();
      if (!result.granted) {
        Alert.alert('Permission Required', 'Camera access is needed to scan barcodes.');
        return;
      }
    }
    setScanned(false);
    setStoreName('');
    setScannerVisible(true);
  };

  const handleBarCodeScanned = ({ data }: { data: string }) => {
    if (scanned) return;
    setScanned(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setScannerVisible(false);
    // Prompt for store name after scan
    setManualCode(data);
    setManualVisible(true);
  };

  const handleSave = () => {
    if (!storeName.trim() || !manualCode.trim()) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    addCard(storeName.trim(), manualCode.trim());
    setManualVisible(false);
    setStoreName('');
    setManualCode('');
  };

  const handleRemove = (id: string) => {
    Alert.alert('Remove Card', 'Remove this loyalty card from your wallet?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => removeCard(id) },
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Pressable onPress={() => navigation.goBack()} style={{ marginRight: 16 }}>
            <Text style={{ fontSize: 24, color: Colors.text }}>←</Text>
          </Pressable>
          <View>
            <Text style={styles.title}>Loyalty Wallet</Text>
            <Text style={styles.subtitle}>Scan your cards at checkout</Text>
          </View>
        </View>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <Pressable style={styles.addBtn} onPress={openScanner}>
            <Text style={styles.addBtnText}>📷 Scan</Text>
          </Pressable>
          <Pressable style={styles.addBtn} onPress={() => { setManualCode(''); setManualVisible(true); }}>
            <Text style={styles.addBtnText}>+ Add</Text>
          </Pressable>
        </View>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: 100 }}>
        {cards.length === 0 && (
          <Text style={styles.empty}>No cards yet. Tap "Scan" to add your first loyalty card.</Text>
        )}
        {cards.map((card) => {
          const isActive = activeCard === card.id;
          return (
            <Pressable
              key={card.id}
              style={[styles.cardContainer, { backgroundColor: card.color }]}
              onPress={() => handleCardPress(card.id)}
              onLongPress={() => handleRemove(card.id)}
            >
              <View style={styles.cardHeader}>
                <Text style={styles.storeName}>{card.store}</Text>
                <Text style={styles.cardIndicator}>{isActive ? '▼' : '▶'}</Text>
              </View>

              {isActive && (
                <View style={styles.barcodeSection}>
                  <View style={styles.qrWrapper}>
                    <QRCode
                      value={card.code}
                      size={width * 0.5}
                      color="#000"
                      backgroundColor="#FFF"
                    />
                  </View>
                  <Text style={styles.codeText}>{card.code}</Text>
                </View>
              )}
            </Pressable>
          );
        })}
        <Text style={styles.hint}>Long-press a card to remove it.</Text>
      </ScrollView>

      {/* Barcode Scanner Modal */}
      <Modal visible={scannerVisible} animationType="slide" onRequestClose={() => setScannerVisible(false)}>
        <View style={styles.scannerContainer}>
          <CameraView
            style={StyleSheet.absoluteFillObject}
            facing="back"
            barcodeScannerSettings={{ barcodeTypes: ['qr', 'ean13', 'ean8', 'code128', 'code39', 'pdf417', 'aztec', 'datamatrix'] }}
            onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
          />
          <View style={styles.scanOverlay}>
            <View style={styles.scanFrame} />
            <Text style={styles.scanHint}>Point at the barcode on your loyalty card</Text>
          </View>
          <Pressable style={styles.closeScanBtn} onPress={() => setScannerVisible(false)}>
            <Text style={styles.closeScanText}>✕ Cancel</Text>
          </Pressable>
        </View>
      </Modal>

      {/* Store Name + Code Modal */}
      <Modal visible={manualVisible} transparent animationType="slide" onRequestClose={() => setManualVisible(false)}>
        <View style={styles.modalBg}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Loyalty Card</Text>
              <Pressable onPress={() => setManualVisible(false)}>
                <Text style={{ fontSize: 20, color: Colors.textMuted }}>✕</Text>
              </Pressable>
            </View>
            <View style={styles.form}>
              <TextInput
                style={styles.input}
                placeholder="Store Name (e.g. BigBazaar)"
                placeholderTextColor={Colors.textMuted}
                value={storeName}
                onChangeText={setStoreName}
              />
              <TextInput
                style={styles.input}
                placeholder="Card Number / Barcode"
                placeholderTextColor={Colors.textMuted}
                value={manualCode}
                onChangeText={setManualCode}
              />
              <Pressable style={styles.submitBtn} onPress={handleSave}>
                <Text style={styles.submitBtnText}>Save to Wallet</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.surface },
  header: { padding: Spacing.lg, paddingBottom: Spacing.md, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontFamily: 'Outfit_700Bold', fontSize: 28, color: Colors.text },
  subtitle: { fontFamily: 'Inter_400Regular', fontSize: 13, color: Colors.textMuted, marginTop: 4 },
  addBtn: { backgroundColor: 'rgba(99, 102, 241, 0.1)', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12 },
  addBtnText: { ...Typography.label, color: Colors.primary },
  content: { paddingHorizontal: Spacing.lg },
  empty: { textAlign: 'center', color: Colors.textMuted, marginTop: 60, fontFamily: 'Inter_400Regular', lineHeight: 22 },
  hint: { textAlign: 'center', color: Colors.textMuted, fontFamily: 'Inter_400Regular', fontSize: 11, marginTop: 8, marginBottom: 24 },
  cardContainer: {
    borderRadius: 20, marginBottom: 16, padding: 24,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1, shadowRadius: 8, elevation: 4,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  storeName: { fontFamily: 'Outfit_700Bold', fontSize: 24, color: '#FFF' },
  cardIndicator: { color: '#FFF', fontSize: 16 },
  barcodeSection: { marginTop: 24, alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.95)', padding: 24, borderRadius: 16 },
  qrWrapper: { padding: 16, backgroundColor: '#FFF', borderRadius: 12 },
  codeText: { fontFamily: 'Inter_700Bold', fontSize: 18, color: '#000', marginTop: 16, letterSpacing: 2 },
  // Scanner
  scannerContainer: { flex: 1, backgroundColor: '#000' },
  scanOverlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center' },
  scanFrame: {
    width: 260, height: 180, borderRadius: 16,
    borderWidth: 2, borderColor: '#FFF',
    backgroundColor: 'transparent',
  },
  scanHint: { color: '#FFF', marginTop: 24, fontFamily: 'Inter_400Regular', fontSize: 14, textAlign: 'center', paddingHorizontal: 40 },
  closeScanBtn: { position: 'absolute', top: 60, right: 24, backgroundColor: 'rgba(0,0,0,0.5)', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20 },
  closeScanText: { color: '#FFF', fontFamily: 'Inter_600SemiBold', fontSize: 14 },
  // Modal
  modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: Colors.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingBottom: 40 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', padding: 24, borderBottomWidth: 1, borderBottomColor: Colors.border },
  modalTitle: { ...Typography.h3, color: Colors.text },
  form: { padding: 24 },
  input: { backgroundColor: Colors.card, padding: 16, borderRadius: 12, borderWidth: 1, borderColor: Colors.border, color: Colors.text, fontFamily: 'Inter_600SemiBold', marginBottom: 16 },
  submitBtn: { backgroundColor: Colors.primary, padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 8 },
  submitBtnText: { color: Colors.onPrimary, ...Typography.bodyBold },
});
