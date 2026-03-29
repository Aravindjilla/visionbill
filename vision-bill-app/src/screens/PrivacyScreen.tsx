import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../theme/colors';
import { Spacing } from '../theme/spacing';

export const PrivacyScreen = ({ onBack }: { onBack: () => void }) => {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={onBack} style={styles.backBtn}><Text style={styles.backText}>← Back</Text></Pressable>
        <Text style={styles.title}>Privacy Policy</Text>
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.updateDate}>Last Updated: March 29, 2026</Text>
        
        <Text style={styles.sectionTitle}>1. Data Collection</Text>
        <Text style={styles.paragraph}>
          VisionBill collects receipt images, extracted financial data, and user profile information (Google ID, name, email) to provide automated expense tracking and pantry management services.
        </Text>

        <Text style={styles.sectionTitle}>2. AI Processing</Text>
        <Text style={styles.paragraph}>
          We use Google Gemini AI models to process receipt images. Receipt data is processed securely and is not used to train global AI models without explicit consent.
        </Text>

        <Text style={styles.sectionTitle}>3. Storage & Security</Text>
        <Text style={styles.paragraph}>
          All data is encrypted in transit and at rest. Receipt images are stored securely on Cloudinary, and financial records are maintained in an encrypted MongoDB database.
        </Text>

        <Text style={styles.sectionTitle}>4. User Rights</Text>
        <Text style={styles.paragraph}>
          You have the right to export your data (CSV/PDF) or request full deletion of your account and all associated scans at any time via the Settings menu.
        </Text>

        <Text style={styles.footer}>VisionBill - Privacy First Finance</Text>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.surface },
  header: { padding: Spacing.lg, flexDirection: 'row', alignItems: 'center' },
  backBtn: { marginRight: 16 },
  backText: { fontFamily: 'Inter_600SemiBold', color: Colors.primary },
  title: { fontFamily: 'Outfit_700Bold', fontSize: 24, color: Colors.text },
  content: { padding: Spacing.lg },
  updateDate: { fontFamily: 'Inter_400Regular', fontSize: 12, color: Colors.textMuted, marginBottom: 24 },
  sectionTitle: { fontFamily: 'Outfit_600SemiBold', fontSize: 18, color: Colors.text, marginTop: 24, marginBottom: 8 },
  paragraph: { fontFamily: 'Inter_400Regular', fontSize: 14, color: Colors.text, lineHeight: 22 },
  footer: { marginTop: 40, textAlign: 'center', fontFamily: 'Inter_600SemiBold', color: Colors.textMuted, fontSize: 12, paddingBottom: 40 },
});
