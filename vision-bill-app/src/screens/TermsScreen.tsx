import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../theme/colors';
import { Spacing } from '../theme/spacing';

export const TermsScreen = ({ navigation }: any) => {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>← Back</Text>
        </Pressable>
        <Text style={styles.title}>Terms of Service</Text>
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.updateDate}>Last Updated: April 5, 2026</Text>

        <Text style={styles.sectionTitle}>1. Acceptance of Terms</Text>
        <Text style={styles.paragraph}>
          By downloading, installing, or using VisionBill ("the App"), you agree to be bound by these Terms of Service. If you do not agree to these terms, do not use the App.
        </Text>

        <Text style={styles.sectionTitle}>2. Description of Service</Text>
        <Text style={styles.paragraph}>
          VisionBill is an AI-powered receipt scanning and expense tracking application. The App uses Google Gemini AI to extract and categorise data from receipt images. Features include pantry tracking, bill splitting, expense settlement, and monthly spending analytics.
        </Text>

        <Text style={styles.sectionTitle}>3. Account Registration</Text>
        <Text style={styles.paragraph}>
          You must sign in with a valid Google account to use VisionBill. You are responsible for maintaining the confidentiality of your account and for all activity that occurs under your account. You must be at least 13 years old (or the minimum age required in your country) to use the App.
        </Text>

        <Text style={styles.sectionTitle}>4. Free and Pro Tiers</Text>
        <Text style={styles.paragraph}>
          The free tier permits up to 5 receipt scans per calendar month. The Pro tier offers unlimited scans and access to premium features. Tier limits are enforced server-side and cannot be bypassed. Subscription pricing and benefits are displayed within the App and may change with 30 days' notice.
        </Text>

        <Text style={styles.sectionTitle}>5. Acceptable Use</Text>
        <Text style={styles.paragraph}>
          You agree not to use the App to upload illegal, harmful, or offensive content; to attempt to reverse-engineer, scrape, or extract data from the service; to use the App for commercial resale without written consent; or to interfere with the security or integrity of the App's infrastructure.
        </Text>

        <Text style={styles.sectionTitle}>6. AI-Generated Content</Text>
        <Text style={styles.paragraph}>
          Receipt data extracted by Gemini AI is provided on a best-effort basis and may contain errors. VisionBill does not guarantee the accuracy of extracted amounts, merchant names, or item descriptions. You are responsible for verifying all financial data before relying on it for tax, accounting, or legal purposes.
        </Text>

        <Text style={styles.sectionTitle}>7. Data Ownership</Text>
        <Text style={styles.paragraph}>
          You retain ownership of all receipt images and financial data you upload. By using the App, you grant VisionBill a limited, non-exclusive licence to store, process, and display your data solely to provide the service. We do not sell your personal data to third parties.
        </Text>

        <Text style={styles.sectionTitle}>8. Account Deletion</Text>
        <Text style={styles.paragraph}>
          You may permanently delete your account at any time from the Profile screen. Deletion will irreversibly remove all scans, pantry items, group records, and settlement history. Data may be retained in encrypted backups for up to 30 days following deletion.
        </Text>

        <Text style={styles.sectionTitle}>9. Limitation of Liability</Text>
        <Text style={styles.paragraph}>
          VisionBill is provided "as is" without warranty of any kind. To the maximum extent permitted by applicable law, we are not liable for any indirect, incidental, or consequential damages arising from your use of the App, including loss of data or financial decisions made based on App-generated content.
        </Text>

        <Text style={styles.sectionTitle}>10. Changes to Terms</Text>
        <Text style={styles.paragraph}>
          We may update these Terms from time to time. We will notify you of material changes via a notice within the App. Continued use after changes take effect constitutes your acceptance of the updated Terms.
        </Text>

        <Text style={styles.sectionTitle}>11. Governing Law</Text>
        <Text style={styles.paragraph}>
          These Terms are governed by the laws of India. Any disputes shall be subject to the exclusive jurisdiction of the courts of Bangalore, Karnataka, India.
        </Text>

        <Text style={styles.sectionTitle}>12. Contact</Text>
        <Text style={styles.paragraph}>
          For questions about these Terms, contact us at support@visionbill.app.
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
