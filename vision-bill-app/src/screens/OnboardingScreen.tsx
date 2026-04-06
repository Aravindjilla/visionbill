import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, Dimensions, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LottieView from 'lottie-react-native';
import { MotiView } from 'moti';
import * as Haptics from 'expo-haptics';
import { Colors } from '../theme/colors';
import { Spacing } from '../theme/spacing';

const { width, height } = Dimensions.get('window');

const SLIDES = [
  {
    id: '1',
    title: 'Precision AI Scanning',
    subtitle: 'Extract every item, quantity, and price from your receipts with near-perfect accuracy using Gemini 1.5 Flash.',
    lottie: require('../../assets/animations/scan_processing.json'),
  },
  {
    id: '2',
    title: 'Smart Pantry Insights',
    subtitle: 'Automatically track price hikes on your daily staples. Know exactly when your favorite brands get expensive.',
    lottie: require('../../assets/animations/empty_pantry.json'),
  },
  {
    id: '3',
    title: 'Effortless Bill Splitting',
    subtitle: 'Split group expenses in seconds. Generate UPI payment links and WhatsApp-ready summaries for your friends.',
    lottie: require('../../assets/animations/empty_groups.json'),
  },
];

export const OnboardingScreen = ({ onFinish }: { onFinish: () => void }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  const handleNext = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
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
          const newIndex = Math.round(e.nativeEvent.contentOffset.x / width);
          if (newIndex !== currentIndex) {
            setCurrentIndex(newIndex);
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          }
        }}
        renderItem={({ item, index }) => (
          <View style={styles.slide}>
            <MotiView
              from={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: 'spring', damping: 18, stiffness: 120, delay: 100 }}
              style={styles.lottieWrapper}
            >
              <LottieView
                source={item.lottie}
                autoPlay
                loop
                style={styles.lottie}
              />
            </MotiView>
            <MotiView
              // Re-key by index so the animation replays each time the slide becomes active
              key={`text-${index}-${currentIndex === index}`}
              from={{ opacity: 0, translateY: 24 }}
              animate={{ opacity: currentIndex === index ? 1 : 0, translateY: currentIndex === index ? 0 : 24 }}
              transition={{ type: 'spring', damping: 20, stiffness: 140, delay: 180 }}
              style={styles.textContent}
            >
              <Text style={styles.title}>{item.title}</Text>
              <Text style={styles.subtitle}>{item.subtitle}</Text>
            </MotiView>
          </View>
        )}
      />

      <View style={styles.footer}>
        {/* Animated pagination dots */}
        <View style={styles.pagination}>
          {SLIDES.map((_, i) => (
            <MotiView
              key={i}
              animate={{
                width: currentIndex === i ? 28 : 8,
                opacity: currentIndex === i ? 1 : 0.35,
                backgroundColor: currentIndex === i ? Colors.primary : Colors.border,
              }}
              transition={{ type: 'spring', damping: 18, stiffness: 200 }}
              style={styles.dot}
            />
          ))}
        </View>

        <MotiView
          from={{ opacity: 0, translateY: 16 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'spring', damping: 20, delay: 300 }}
        >
          <Pressable style={styles.button} onPress={handleNext}>
            <Text style={styles.buttonText}>
              {currentIndex === SLIDES.length - 1 ? 'Start Scanning' : 'Next'}
            </Text>
          </Pressable>
        </MotiView>

        <Pressable style={styles.skip} onPress={onFinish}>
          <Text style={styles.skipText}>Skip</Text>
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
  pagination: { flexDirection: 'row', marginBottom: 40, alignItems: 'center' },
  dot: { height: 8, borderRadius: 4, marginHorizontal: 4 },
  button: { width: width - Spacing.xl * 2, backgroundColor: Colors.primary, padding: 18, borderRadius: 18, alignItems: 'center' },
  buttonText: { fontFamily: 'Inter_700Bold', fontSize: 18, color: '#FFF' },
  skip: { marginTop: 20 },
  skipText: { fontFamily: 'Inter_600SemiBold', fontSize: 14, color: Colors.textMuted },
});
