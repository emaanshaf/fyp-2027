import { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useColors, useGlobalStyles, useThemedStyles } from '../theme';
import { LEGAL_DOCUMENTS, legalDocument } from '../data/legal';
import { openExternalUrl } from '../utils/externalLink';
import APP_CONFIG from '../config/appConfig';

/**
 * In-app privacy policy and terms.
 *
 * Reached from Settings, not from the drawer: a legal document is not a
 * content module, and the five product guardrails say not to add top-level
 * modules without an exception. The text lives in src/data/legal.js so it can
 * be read offline; "Open online version" exists for the store listing and for
 * anyone who prefers the hosted copy.
 */
export default function LegalScreen({ route }) {
  const COLORS = useColors();
  const globalStyles = useGlobalStyles();
  const styles = useThemedStyles(makeStyles);

  const requested = route?.params?.document;
  const [active, setActive] = useState(requested === 'terms' ? 'terms' : 'privacy');

  // The same screen is reused for both documents, so a second navigate() with
  // a different param must switch it rather than being ignored on mount.
  useEffect(() => {
    if (requested && LEGAL_DOCUMENTS[requested]) setActive(requested);
  }, [requested]);

  const doc = legalDocument(active);
  const onlineUrl = active === 'terms' ? APP_CONFIG.termsUrl : APP_CONFIG.privacyUrl;

  const openOnline = async () => {
    const opened = await openExternalUrl(onlineUrl);
    if (!opened) {
      Alert.alert(doc.title, `Open this address in a browser:\n\n${onlineUrl}`);
    }
  };

  return (
    <SafeAreaView style={globalStyles.screen} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.switcher} accessibilityRole="tablist">
          <TouchableOpacity
            style={[styles.switchTab, active === 'privacy' && styles.switchTabActive]}
            onPress={() => setActive('privacy')}
            accessibilityRole="tab"
            accessibilityState={{ selected: active === 'privacy' }}
          >
            <Text style={[styles.switchText, active === 'privacy' && styles.switchTextActive]}>
              Privacy
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.switchTab, active === 'terms' && styles.switchTabActive]}
            onPress={() => setActive('terms')}
            accessibilityRole="tab"
            accessibilityState={{ selected: active === 'terms' }}
          >
            <Text style={[styles.switchText, active === 'terms' && styles.switchTextActive]}>
              Terms
            </Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.title}>{doc.title}</Text>
        <Text style={styles.updated}>Last updated {doc.updated}</Text>

        <View style={styles.summaryCard}>
          <Ionicons name="information-circle-outline" size={18} color={COLORS.gold} />
          <Text style={styles.summaryText}>{doc.summary}</Text>
        </View>

        {doc.sections.map(section => (
          <View key={section.title} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            {section.paragraphs?.map((paragraph, i) => (
              <Text key={`p${i}`} style={styles.paragraph}>{paragraph}</Text>
            ))}
            {section.bullets?.length > 0 && (
              <View style={styles.bullets}>
                {section.bullets.map((bullet, i) => (
                  <View key={`b${i}`} style={styles.bulletRow}>
                    <Text style={styles.bulletMark}>•</Text>
                    <Text style={styles.bulletText}>{bullet}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        ))}

        <TouchableOpacity
          style={styles.onlineBtn}
          onPress={openOnline}
          accessibilityRole="link"
          accessibilityLabel={`Open the online version of the ${doc.title}`}
        >
          <Ionicons name="open-outline" size={16} color={COLORS.gold} />
          <Text style={styles.onlineBtnText}>Open online version</Text>
        </TouchableOpacity>
        <Text style={styles.onlineUrl} numberOfLines={1}>{onlineUrl}</Text>
        <Text style={styles.footnote}>
          This copy is stored in the app so you can read it without a connection.
          If the two versions differ, the published one applies.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const makeStyles = COLORS => StyleSheet.create({
  content: { padding: 20, paddingBottom: 40 },
  switcher: {
    flexDirection: 'row',
    backgroundColor: COLORS.glass,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    padding: 4,
    marginBottom: 20,
  },
  switchTab: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: 9,
    alignItems: 'center',
  },
  switchTabActive: { backgroundColor: COLORS.gold },
  switchText: { color: COLORS.textSecondary, fontSize: 13, fontWeight: '700' },
  switchTextActive: { color: '#000' },
  title: { color: COLORS.textPrimary, fontSize: 26, fontWeight: '800', letterSpacing: -0.5 },
  updated: { color: COLORS.textSecondary, fontSize: 12, marginTop: 4, marginBottom: 16 },
  summaryCard: {
    flexDirection: 'row',
    gap: 10,
    backgroundColor: COLORS.glass,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    padding: 14,
    marginBottom: 8,
  },
  summaryText: { flex: 1, color: COLORS.textPrimary, fontSize: 14, lineHeight: 21 },
  section: { marginTop: 22 },
  sectionTitle: { color: COLORS.gold, fontSize: 16, fontWeight: '800', marginBottom: 8 },
  paragraph: { color: COLORS.textPrimary, fontSize: 14, lineHeight: 22, marginBottom: 10 },
  bullets: { gap: 8, marginBottom: 4 },
  bulletRow: { flexDirection: 'row', gap: 8 },
  bulletMark: { color: COLORS.gold, fontSize: 14, lineHeight: 22 },
  bulletText: { flex: 1, color: COLORS.textPrimary, fontSize: 14, lineHeight: 22 },
  onlineBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 30,
    paddingVertical: 13,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.gold,
  },
  onlineBtnText: { color: COLORS.gold, fontSize: 14, fontWeight: '700' },
  onlineUrl: { color: COLORS.textSecondary, fontSize: 11, textAlign: 'center', marginTop: 8 },
  footnote: {
    color: COLORS.textSecondary,
    fontSize: 12,
    lineHeight: 18,
    marginTop: 20,
    textAlign: 'center',
  },
});
