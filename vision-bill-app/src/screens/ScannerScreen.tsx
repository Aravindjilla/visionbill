import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, ActivityIndicator, ViewStyle, Image, ScrollView } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Haptics from 'expo-haptics';
import { Colors } from '../theme/colors';
import { Spacing } from '../theme/spacing';
import { useScanStore } from '../store/useScanStore';
import { ScanResponse } from '../types';
import axios from 'axios';


import LottieView from 'lottie-react-native';

export const ScannerScreen = ({ navigation }: any) => {
  const [permission, requestPermission] = useCameraPermissions();
  const [camera, setCamera] = useState<any>(null);
  const { addImage, currentImages, clearImages, setScan, setLoading, loading, loadingMessage } = useScanStore();
  const [isLongBill, setIsLongBill] = useState(false);

  useEffect(() => {
    if (!permission) {
      requestPermission();
    }
  }, [permission]);

  const takePicture = async () => {
    if (camera) {
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
      photos.forEach((photo, index) => {
        formData.append('images', {
          uri: photo.uri,
          name: `segment_${index}.jpg`,
          type: 'image/jpeg',
        } as any);
      });

      const response = await axios.post<ScanResponse>('http://localhost:3000/scans/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setScan(response.data.scan);
      clearImages();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      navigation.navigate('Verification');
    } catch (error) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      console.error('Scan failed', error);
      // Mock Fallback
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

  if (!permission) return <View style={styles.container} />;
  
  return (
    <View style={styles.container}>
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
  container: { flex: 1, backgroundColor: '#000' },
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
  headerTitle: { fontFamily: 'Outfit_700Bold', fontSize: 20, color: '#FFF' },
  modeToggle: { marginTop: 12, backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 16, paddingVertical: 6, borderRadius: 12 },
  modeToggleText: { fontFamily: 'Inter_600SemiBold', fontSize: 12, color: '#FFF' },
  guideContainer: { flex: 1, padding: 40, justifyContent: 'center' },
  guide: { flex: 1, borderWidth: 2, borderColor: 'rgba(255,255,255,0.5)', borderRadius: 20, borderStyle: 'dashed' },
  footer: { paddingBottom: 40, alignItems: 'center' },
  previewScroll: { maxHeight: 60, marginBottom: 20, paddingHorizontal: 20 },
  previewThumb: { width: 40, height: 60, borderRadius: 4, marginRight: 8, borderWidth: 1, borderColor: '#FFF' },
  controls: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', width: '100%' },
  captureButton: { width: 72, height: 72, borderRadius: 36, backgroundColor: 'rgba(255,255,255,0.3)', alignItems: 'center', justifyContent: 'center' },
  captureInner: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#FFF' },
  finishButton: { position: 'absolute', right: 40, backgroundColor: Colors.success, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 12 },
  finishButtonText: { fontFamily: 'Inter_700Bold', fontSize: 14, color: '#FFF' },
  loadingOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 100, alignItems: 'center', justifyContent: 'center', padding: 40 },
  loadingLottie: { width: 250, height: 250 },
  loadingText: { color: '#FFF', fontFamily: 'Outfit_700Bold', fontSize: 18, textAlign: 'center', marginTop: 20 },
});
