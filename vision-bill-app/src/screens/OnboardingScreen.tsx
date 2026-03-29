import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, Dimensions, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LottieView from 'lottie-react-native';
import { Colors } from '../theme/colors';
import { Spacing } from '../theme/spacing';

const { width, height } = Dimensions.get('window');

const SLIDES = [
  {
    id: '1',
    title: 'Precision AI Scanning',
    subtitle: 'Extract every item, quantity, and price from your receipts with near-perfect accuracy using Gemini 1.5 Flash.',
    lottie: 'https://lottie.host/8e3a2c5f-7f5b-4c4c-8f8a-9e8a7b6c5d4f/scan.json' // Placeholder Lottie
  },
  {
    id: '2',
    title: 'Smart Pantry Insights',
    subtitle: 'Automatically track price hikes on your daily staples. Know exactly when your favorite brands get expensive.',
    lottie: 'https://lottie.host/e660995c-7d5d-4f81-8b2b-6899f8d660e1/p8D960aX8U.json'
  },
  {
    id: '3',
    title: 'Effortless Bill Splitting',
    subtitle: 'Split group expenses in seconds. Generate UPI payment links and WhatsApp-ready summaries for your friends.',
    lottie: 'https://lottie.host/c5a1735e-c437-4904-ba71-7597feec2c30/split.json'
  }
];

export const OnboardingScreen = ({ onFinish }: { onFinish: () => void }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  const handleNext = () => {
    if (currentIndex < SLIDES.length - 1) {
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1 });
    } else {
      onFinish();
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        ref={flatListRef}
        data={SLIDES}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(e) => {
          setCurrentIndex(Math.round(e.nativeEvent.contentOffset.x / width));
        }}
        renderItem={({ item }) => (
          <View style={styles.slide}>
            <View style={styles.lottieWrapper}>
               <LottieView 
                 source={{ uri: item.lottie }}
                 autoPlay 
                 loop 
                 style={styles.lottie} 
               />
            </View>
            <View style={styles.textContent}>
              <Text style={styles.title}>{item.title}</Text>
              <Text style={styles.subtitle}>{item.subtitle}</Text>
            </View>
          </View>
        )}
      />

      <View style={styles.footer}>
        <View style={styles.pagination}>
          {SLIDES.map((_, i) => (
            <View key={i} style={[styles.dot, currentIndex === i && styles.activeDot]} />
          ))}
        </View>
        
        <Pressable style={styles.button} onPress={handleNext}>
          <Text style={styles.buttonText}>{currentIndex === SLIDES.length - 1 ? 'Start Scanning' : 'Next'}</Text>
        </Pressable>
        
        <Pressable style={styles.skip} onPress={onFinish}>
          <Text style={styles.skipText}>Skip Onboarding</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.surface },
  slide: { width, alignItems: 'center', padding: Spacing.xl },
  lottieWrapper: { width: '100%', height: height * 0.4, justifyContent: 'center', alignItems: 'center' },
  lottie: { width: 300, height: 300 },
  textContent: { alignItems: 'center', marginTop: 40 },
  title: { fontFamily: 'Outfit_700Bold', fontSize: 28, color: Colors.text, textAlign: 'center' },
  subtitle: { fontFamily: 'Inter_400Regular', fontSize: 16, color: Colors.textMuted, textAlign: 'center', marginTop: 16, lineHeight: 24, paddingHorizontal: 20 },
  footer: { padding: Spacing.xl, alignItems: 'center' },
  pagination: { flexDirection: 'row', marginBottom: 40 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.border, marginHorizontal: 4 },
  activeDot: { width: 24, backgroundColor: Colors.primary },
  button: { width: '100%', backgroundColor: Colors.primary, padding: 18, borderRadius: 18, alignItems: 'center' },
  buttonText: { fontFamily: 'Inter_700Bold', fontSize: 18, color: '#FFF' },
  skip: { marginTop: 20 },
  skipText: { fontFamily: 'Inter_600SemiBold', fontSize: 14, color: Colors.textMuted },
});
