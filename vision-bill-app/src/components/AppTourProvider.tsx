import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, Modal, Dimensions, Pressable, Animated } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors } from '../theme/colors';
import { Spacing } from '../theme/spacing';
import { Typography } from '../theme/typography';

const { width, height } = Dimensions.get('window');

interface TourStep {
  id: string;
  title: string;
  description: string;
  targetId: string;
}

interface TourContextType {
  activeStep: number;
  isActive: boolean;
  startTour: () => void;
  nextStep: () => void;
  skipTour: () => void;
  registerTarget: (id: string, layout: { x: number; y: number; width: number; height: number }) => void;
}

const TourContext = createContext<TourContextType | undefined>(undefined);

const TOUR_STEPS: TourStep[] = [
  {
    id: 'scan',
    title: 'Precision Scanner 📸',
    description: 'Tap here to scan your first receipt. Our AI will extract all items and taxes automatically.',
    targetId: 'scanner-btn',
  },
  {
    id: 'stats',
    title: 'Spending Insights 📊',
    description: 'Track your total spending and monthly savings at a glance.',
    targetId: 'stats-card',
  },
  {
    id: 'pantry',
    title: 'Smart Pantry 🥦',
    description: 'Monitor price hikes on your favorite items and track your inventory here.',
    targetId: 'pantry-link',
  },
];

export const AppTourProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeStep, setActiveStep] = useState(-1);
  const [targets, setTargets] = useState<Record<string, any>>({});
  const fadeAnim = useState(new Animated.Value(0))[0];

  useEffect(() => {
    checkTourStatus();
  }, []);

  const checkTourStatus = async () => {
    const completed = await AsyncStorage.getItem('has_completed_tour');
    if (!completed) {
      // Small delay to ensure layout is ready
      setTimeout(() => startTour(), 2000);
    }
  };

  const startTour = () => {
    setActiveStep(0);
    Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }).start();
  };

  const nextStep = () => {
    if (activeStep < TOUR_STEPS.length - 1) {
      setActiveStep(activeStep + 1);
    } else {
      finishTour();
    }
  };

  const skipTour = () => finishTour();

  const finishTour = async () => {
    Animated.timing(fadeAnim, { toValue: 0, duration: 200, useNativeDriver: true }).start(() => {
      setActiveStep(-1);
    });
    await AsyncStorage.setItem('has_completed_tour', 'true');
  };

  const registerTarget = useCallback((id: string, layout: any) => {
    setTargets(prev => ({ ...prev, [id]: layout }));
  }, []);

  const currentStepData = activeStep >= 0 ? TOUR_STEPS[activeStep] : null;
  const currentLayout = currentStepData ? targets[currentStepData.targetId] : null;

  return (
    <TourContext.Provider value={{ activeStep, isActive: activeStep >= 0, startTour, nextStep, skipTour, registerTarget }}>
      {children}
      {activeStep >= 0 && currentLayout && (
        <Modal transparent visible={activeStep >= 0} animationType="none">
          <View style={styles.overlay}>
            {/* Spotlight Hole (simplified for custom implementation) */}
            <View style={[styles.spotlight, { 
              top: currentLayout.y - 4, 
              left: currentLayout.x - 4, 
              width: currentLayout.width + 8, 
              height: currentLayout.height + 8 
            }]} />
            
            <Animated.View style={[styles.tooltip, { opacity: fadeAnim, top: currentLayout.y > height / 2 ? currentLayout.y - 160 : currentLayout.y + currentLayout.height + 20 }]}>
              <Text style={styles.title}>{currentStepData?.title}</Text>
              <Text style={styles.description}>{currentStepData?.description}</Text>
              <View style={styles.footer}>
                <Pressable onPress={skipTour}><Text style={styles.skipText}>Skip</Text></Pressable>
                <Pressable style={styles.nextBtn} onPress={nextStep}>
                  <Text style={styles.nextText}>{activeStep === TOUR_STEPS.length - 1 ? 'Finish' : 'Next'}</Text>
                </Pressable>
              </View>
            </Animated.View>
          </View>
        </Modal>
      )}
    </TourContext.Provider>
  );
};

export const useTour = () => {
  const context = useContext(TourContext);
  if (!context) throw new Error('useTour must be used within AppTourProvider');
  return context;
};

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)' },
  spotlight: { position: 'absolute', backgroundColor: 'transparent', borderRadius: 12, borderWidth: 2, borderColor: Colors.primary, borderStyle: 'dashed' },
  tooltip: { position: 'absolute', left: 20, right: 20, backgroundColor: '#FFF', padding: 20, borderRadius: 20, elevation: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 10 },
  title: { fontFamily: 'Outfit_700Bold', fontSize: 18, color: Colors.text, marginBottom: 8 },
  description: { fontFamily: 'Inter_400Regular', fontSize: 14, color: Colors.textMuted, lineHeight: 20 },
  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 20 },
  skipText: { fontFamily: 'Inter_600SemiBold', color: Colors.textMuted },
  nextBtn: { backgroundColor: Colors.primary, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 12 },
  nextText: { color: '#FFF', fontFamily: 'Inter_700Bold' },
});
