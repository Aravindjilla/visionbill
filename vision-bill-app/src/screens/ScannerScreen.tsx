import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, ActivityIndicator, ViewStyle, Image, ScrollView, Alert } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImageManipulator from 'expo-image-manipulator';
import * as Haptics from 'expo-haptics';
import { Colors } from '../theme/colors';
import { Spacing } from '../theme/spacing';
import { Typography } from '../theme/typography';
import { useScanStore } from '../store/useScanStore';
import { useAuthStore } from '../store/useAuthStore';
import { PaywallModal } from '../components/PaywallModal';
import { ScanResponse } from '../types';
import axios from 'axios';
import api from '../utils/api';

import LottieView from 'lottie-react-native';

export const ScannerScreen = ({ navigation }: any) => {
  const [permission, requestPermission] = useCameraPermissions();
  const [camera, setCamera] = useState<any>(null);
  const { addImage, currentImages, clearImages, setScan, setLoading, setError, loading, loadingMessage, error } = useScanStore();
  const { tier, monthlyScanCount } = useAuthStore();
  
  const [isLongBill, setIsLongBill] = useState(false);
  const [paywallVisible, setPaywallVisible] = useState(false);

  useEffect(() => {
    if (tier === 'free' && (monthlyScanCount || 0) >= 5) {
      setPaywallVisible(true);
    }
  }, [tier, monthlyScanCount]);

  useEffect(() => {
    if (!permission) {
      requestPermission();
    }
  }, [permission]);

  const takePicture = async () => {
    if (camera) {
      if (isLongBill && currentImages.length >= 5) {
        Alert.alert('Max Limit Reached', 'You can only scan up to 5 segments per bill to ensure reliable processing.');
        return;
      }
      
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      const photo = await camera.takePictureAsync({ base64: true });
      addImage(photo);
      
      if (!isLongBill) {
        processScan([photo]);
      }
    }
  };

  const processScan = async (photos: any[]) => {
    setLoading(true, 'Processing receipt with Gemini AI...');
    try {
      const formData = new FormData();
      
      for (let i = 0; i < photos.length; i++) {
        // Optimize image locally before hitting server
        const manipulated = await ImageManipulator.manipulateAsync(
          photos[i].uri,
          [{ resize: { width: 1080 } }],
          { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG }
        );

        formData.append('images', {
          uri: manipulated.uri,
          name: `segment_${i}.jpg`,
          type: 'image/jpeg',
        } as any);
      }

      const response = await api.post<ScanResponse>('/scans/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setScan(response.data.scan);
      clearImages();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      navigation.navigate('Verification');
    } catch (err: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      const message = err?.response?.data?.message || err?.message || 'Scan failed. Using demo data.';
      setError(message);
      // Mock Fallback for dev/demo
      setScan({
        _id: 'mock-id',
        userId: 'demo-user-id',
        imageUrl: 'https://via.placeholder.com/400x600',
        billType: 'grocery',
        status: 'completed',
        createdAt: new Date().toISOString(),
        extractedTotal: 595.00,
        items: [
          { shorthand: 'ORG_TMT_1KG', cleanName: 'Organic Tomato 1kg', category: 'Veggies', price: 150.00, qty: 1 },
          { shorthand: 'MILK_FT_1L', cleanName: 'Full Cream Milk 1L', category: 'Dairy', price: 65.00, qty: 1 },
          { shorthand: 'WHEAT_ATTA_5KG', cleanName: 'Whole Wheat Atta 5kg', category: 'Atta', price: 380.00, qty: 1 },
        ],
      });

      clearImages();
      navigation.navigate('Verification');
    } finally {
      setLoading(false);
    }
  };


  const finalizeLongBill = () => {
    if (currentImages.length > 0) {
      processScan(currentImages);
    }
  };

  if (!permission) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center', padding: 40 }]}>
        <Text style={[Typography.h2, { color: Colors.text, textAlign: 'center' }]}>📸 Camera Access</Text>
        <Text style={[Typography.caption, { color: Colors.textMuted, textAlign: 'center', marginTop: 12, marginBottom: 32 }]}>
          We need your camera to scan receipts and extract itemized data.
        </Text>
        <Pressable 
          onPress={requestPermission}
          style={{ backgroundColor: Colors.primary, paddingHorizontal: 32, paddingVertical: 14, borderRadius: 16 }}
        >
          <Text style={[Typography.bodyBold, { color: Colors.onPrimary }]}>Grant Access</Text>
        </Pressable>
      </View>
    );
  }
  
  return (
    <View style={styles.container}>
      {!!error && (
        <Pressable
          style={styles.errorBanner}
          onPress={() => setError(null)}
        >
          <Text style={styles.errorBannerText}>⚠️ {error} — tap to dismiss</Text>
        </Pressable>
      )}
      {loading && (
        <View style={styles.loadingOverlay}>
          <LottieView 
            source={{ uri: 'https://lottie.host/8e3172ca-635e-4686-a517-5e6e3cda83bc/X1Ld4A9H6p.json' }} 
            autoPlay 
            loop 
            style={styles.loadingLottie}
          />
          <Text style={styles.loadingText}>{loadingMessage || 'Processing...'}</Text>
        </View>
      )}
      <CameraView 
        style={styles.camera} 
        facing="back"
        ref={(ref: any) => setCamera(ref)}
      >
        <View style={styles.overlay}>
          {/* Ghosting Overlay */}
          {isLongBill && currentImages.length > 0 && (
            <View style={styles.ghostContainer}>
              <Image 
                source={{ uri: currentImages[currentImages.length - 1].uri }} 
                style={styles.ghostImage}
                resizeMode="cover"
              />
              <View style={styles.ghostOverlay} />
            </View>
          )}

          <View style={styles.header}>
            <Text style={styles.headerTitle}>
              {isLongBill ? `Segment ${currentImages.length + 1}` : 'Position Receipt'}
            </Text>
            <Pressable 
              onPress={() => {
                setIsLongBill(!isLongBill);
                clearImages();
              }}
              style={styles.modeToggle}
            >
              <Text style={styles.modeToggleText}>
                {isLongBill ? 'Switch to Single' : 'Long Bill Mode'}
              </Text>
            </Pressable>
          </View>

          <View style={styles.guideContainer}>
            <View style={styles.guide} />
          </View>

          <View style={styles.footer}>
            <ScrollView horizontal style={styles.previewScroll}>
              {currentImages.map((img, i) => (
                <Image key={i} source={{ uri: img.uri }} style={styles.previewThumb} />
              ))}
            </ScrollView>

            <View style={styles.controls}>
              <Pressable 
                disabled={loading}
                onPress={takePicture}
                style={({ pressed }): ViewStyle[] => [
                  styles.captureButton as ViewStyle,
                  pressed ? { transform: [{ scale: 0.95 }] } : {}
                ]}
              >
                {loading ? <ActivityIndicator color="#FFF" /> : <View style={styles.captureInner} />}
              </Pressable>

              {isLongBill && currentImages.length > 0 && (
                <Pressable onPress={finalizeLongBill} style={styles.finishButton}>
                  <Text style={styles.finishButtonText}>Finish ({currentImages.length})</Text>
                </Pressable>
              )}
            </View>
          </View>
        </View>
      </CameraView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.surface },
  camera: { flex: 1 },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.2)', justifyContent: 'space-between' },
  ghostContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 120,
    opacity: 0.3,
    overflow: 'hidden',
  },
  ghostImage: { width: '100%', height: 400, marginTop: -280 },
  ghostOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: Colors.primary, opacity: 0.1 },
  header: { paddingTop: 60, alignItems: 'center' },
  headerTitle: { ...Typography.h3, color: Colors.text },
  modeToggle: { marginTop: 12, backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 16, paddingVertical: 6, borderRadius: 12 },
  modeToggleText: { ...Typography.label, color: Colors.text, textTransform: 'none' },
  guideContainer: { flex: 1, padding: 40, justifyContent: 'center' },
  guide: { flex: 1, borderWidth: 2, borderColor: 'rgba(255,255,255,0.5)', borderRadius: 20, borderStyle: 'dashed' },
  footer: { paddingBottom: 40, alignItems: 'center' },
  previewScroll: { maxHeight: 60, marginBottom: 20, paddingHorizontal: 20 },
  previewThumb: { width: 40, height: 60, borderRadius: 4, marginRight: 8, borderWidth: 1, borderColor: Colors.text },
  controls: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', width: '100%' },
  captureButton: { width: 72, height: 72, borderRadius: 36, backgroundColor: 'rgba(255,255,255,0.3)', alignItems: 'center', justifyContent: 'center' },
  captureInner: { width: 56, height: 56, borderRadius: 28, backgroundColor: Colors.text },
  finishButton: { position: 'absolute', right: 40, backgroundColor: Colors.success, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 12 },
  finishButtonText: { ...Typography.bodyBold, color: Colors.onPrimary },
  errorBanner: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 200, backgroundColor: 'rgba(239,68,68,0.92)', padding: 12, alignItems: 'center' },
  errorBannerText: { color: '#FFF', fontFamily: 'Inter_600SemiBold', fontSize: 12, textAlign: 'center' },
  loadingOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 100, alignItems: 'center', justifyContent: 'center', padding: 40 },
  loadingLottie: { width: 250, height: 250 },
  loadingText: { color: Colors.text, ...Typography.h3, textAlign: 'center', marginTop: 20 },
});
