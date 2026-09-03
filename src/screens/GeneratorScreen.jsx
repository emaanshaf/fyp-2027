import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  StyleSheet, Modal
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Sharing from 'expo-sharing';
import { COLORS, globalStyles } from '../theme';

const TEMPLATES = [
  {
    id: 'quran',
    label: 'Quranic Verse',
    icon: 'book-outline',
    placeholder: 'Enter the Arabic verse...',
    citePlaceholder: 'e.g. Surah Al-Baqarah 2:286',
    gradient: ['#1a0a00', '#3d1a00', '#1a0a00'],
    accent: '#ffffff',
  },
  {
    id: 'hadith',
    label: 'Hadith Card',
    icon: 'shield-checkmark-outline',
    placeholder: 'Enter hadith text...',
    citePlaceholder: 'e.g. Sahih Bukhari, Hadith 6412',
    gradient: ['#001a0a', '#003d1a', '#001a0a'],
    accent: '#ffffff',
  },
  {
    id: 'dua',
    label: 'Dua Card',
    icon: 'heart-outline',
    placeholder: 'Enter the Arabic dua...',
    citePlaceholder: 'e.g. Fortress of the Muslim',
    gradient: ['#1a0015', '#3d0030', '#1a0015'],
    accent: '#ff4444',
  },
  {
    id: 'reminder',
    label: 'Islamic Reminder',
    icon: 'notifications-outline',
    placeholder: 'Enter your reminder message...',
    citePlaceholder: 'e.g. Author or Source (optional)',
    gradient: ['#00101a', '#00253d', '#00101a'],
    accent: '#ffffff',
  },
];

export default function GeneratorScreen() {
  const [template, setTemplate] = useState(TEMPLATES[0]);
  const [content, setContent] = useState('');
  const [citation, setCitation] = useState('');
  const [preview, setPreview] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);

  const handleShare = async () => {
    const isAvailable = await Sharing.isAvailableAsync();
    if (!isAvailable) {
      return;
    }
    // Sharing text as a simple text file
    const text = `${content}\n\n— ${citation}\n\nShared via Qitab-e-Noor`;
    await Sharing.shareAsync(`data:text/plain;charset=utf-8,${encodeURIComponent(text)}`).catch(() => {});
  };

  return (
    <SafeAreaView style={globalStyles.screen} edges={['bottom']}>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <Text style={globalStyles.sectionTitle}>Content Creator</Text>
        <Text style={{ color: COLORS.textSecondary, fontSize: 14, marginBottom: 20 }}>
          Design beautiful Islamic graphics and share with your community.
        </Text>

        {/* Template Picker */}
        <Text style={globalStyles.label}>TEMPLATE</Text>
        <TouchableOpacity onPress={() => setPickerOpen(true)} style={styles.templatePicker}>
          <View style={[styles.templateIcon, { backgroundColor: `${template.accent}18` }]}>
            <Ionicons name={template.icon} size={20} color={template.accent} />
          </View>
          <Text style={{ color: COLORS.textPrimary, fontWeight: '700', flex: 1, marginLeft: 10 }}>{template.label}</Text>
          <Ionicons name="chevron-down" size={18} color={COLORS.textSecondary} />
        </TouchableOpacity>

        {/* Content Input */}
        <Text style={[globalStyles.label, { marginTop: 16 }]}>CONTENT</Text>
        <View style={[globalStyles.input, { alignItems: 'flex-start', paddingTop: 12, marginBottom: 14 }]}>
          <TextInput
            style={{ flex: 1, color: COLORS.textPrimary, fontSize: 15, minHeight: 100, textAlignVertical: 'top', width: '100%' }}
            value={content}
            onChangeText={setContent}
            placeholder={template.placeholder}
            placeholderTextColor={COLORS.textSecondary}
            multiline
          />
        </View>

        {/* Citation */}
        <Text style={globalStyles.label}>CITATION / SOURCE</Text>
        <View style={[globalStyles.input, { marginBottom: 20 }]}>
          <Ionicons name="location-outline" size={18} color={COLORS.textSecondary} />
          <TextInput
            style={{ flex: 1, color: COLORS.textPrimary, fontSize: 15, marginLeft: 8 }}
            value={citation}
            onChangeText={setCitation}
            placeholder={template.citePlaceholder}
            placeholderTextColor={COLORS.textSecondary}
          />
        </View>

        {/* Actions */}
        <View style={[globalStyles.row, { gap: 10 }]}>
          <TouchableOpacity
            style={[globalStyles.btnPrimary, { flex: 1 }]}
            onPress={() => setPreview(true)}
            disabled={!content.trim()}
          >
            <Ionicons name="eye-outline" size={18} color="#000" />
            <Text style={globalStyles.btnPrimaryText}>Preview</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[globalStyles.btnPrimary, { flex: 1, backgroundColor: COLORS.glass, borderWidth: 1, borderColor: COLORS.glassBorder }]}
            onPress={handleShare}
            disabled={!content.trim()}
          >
            <Ionicons name="share-outline" size={18} color={COLORS.textPrimary} />
            <Text style={{ color: COLORS.textPrimary, fontWeight: '700' }}>Share</Text>
          </TouchableOpacity>
        </View>

        {/* Quick templates */}
        <Text style={[globalStyles.label, { marginTop: 28, marginBottom: 12 }]}>QUICK FILL</Text>
        {[
          { label: 'Verse of the Day', content: 'Indeed, with hardship comes ease.', cite: 'Surah Ash-Sharh 94:6' },
          { label: 'Morning Reminder', content: 'Start your day with Bismillah and gratitude to Allah.', cite: 'Islamic Wisdom' },
          { label: 'Hadith on Kindness', content: 'The merciful are shown mercy by the Most Merciful. Be merciful to those on earth, and the One in the heavens will be merciful to you.', cite: 'Jami\' al-Tirmidhi, 1924' },
        ].map(q => (
          <TouchableOpacity
            key={q.label}
            onPress={() => { setContent(q.content); setCitation(q.cite); }}
            style={styles.quickItem}
          >
            <Ionicons name="flash-outline" size={16} color={COLORS.gold} />
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={{ color: COLORS.textPrimary, fontWeight: '700' }}>{q.label}</Text>
              <Text style={{ color: COLORS.textSecondary, fontSize: 12 }} numberOfLines={1}>{q.content}</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={COLORS.textSecondary} />
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Template Picker Modal */}
      <Modal visible={pickerOpen} transparent animationType="slide" onRequestClose={() => setPickerOpen(false)}>
        <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.7)' }}>
          <View style={{ backgroundColor: COLORS.bgSecondary, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24 }}>
            <View style={[globalStyles.spaceBetween, { marginBottom: 16 }]}>
              <Text style={{ color: COLORS.textPrimary, fontWeight: '900', fontSize: 18 }}>Choose Template</Text>
              <TouchableOpacity onPress={() => setPickerOpen(false)}>
                <Ionicons name="close" size={22} color={COLORS.textSecondary} />
              </TouchableOpacity>
            </View>
            {TEMPLATES.map(t => (
              <TouchableOpacity
                key={t.id}
                onPress={() => { setTemplate(t); setPickerOpen(false); }}
                style={[styles.tplRow, template.id === t.id && { borderColor: t.accent, backgroundColor: `${t.accent}08` }]}
              >
                <View style={[styles.templateIcon, { backgroundColor: `${t.accent}18` }]}>
                  <Ionicons name={t.icon} size={20} color={t.accent} />
                </View>
                <Text style={{ color: template.id === t.id ? t.accent : COLORS.textPrimary, fontWeight: '700', flex: 1, marginLeft: 12 }}>{t.label}</Text>
                {template.id === t.id && <Ionicons name="checkmark-circle" size={20} color={t.accent} />}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </Modal>

      {/* Preview Modal */}
      <Modal visible={preview} transparent animationType="fade" onRequestClose={() => setPreview(false)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.9)', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          {/* Card Preview */}
          <LinearGradient
            colors={template.gradient}
            style={styles.previewCard}
          >
            {/* Decorative top border */}
            <View style={[styles.topBorder, { backgroundColor: template.accent }]} />

            {/* Branding */}
            <View style={[globalStyles.row, { gap: 6, marginBottom: 20 }]}>
              <Ionicons name="moon" size={14} color={template.accent} />
              <Text style={{ color: template.accent, fontSize: 11, fontWeight: '800', letterSpacing: 2 }}>QITAB-E-NOOR</Text>
            </View>

            {/* Content */}
            <Text style={[styles.previewContent, { color: template.accent }]}>
              {content}
            </Text>

            {/* Divider */}
            <View style={[globalStyles.divider, { borderColor: `${template.accent}30`, marginVertical: 16 }]} />

            {/* Citation */}
            {citation ? (
              <Text style={{ color: '#aaaaaa', fontSize: 13, textAlign: 'center', fontStyle: 'italic' }}>
                — {citation}
              </Text>
            ) : null}

            {/* Bottom decoration */}
            <View style={[styles.bottomBorder, { backgroundColor: template.accent }]} />
          </LinearGradient>

          {/* Actions */}
          <View style={[globalStyles.row, { gap: 12, marginTop: 24 }]}>
            <TouchableOpacity
              onPress={handleShare}
              style={[globalStyles.btnPrimary, { paddingHorizontal: 32 }]}
            >
              <Ionicons name="share-social-outline" size={18} color="#000" />
              <Text style={globalStyles.btnPrimaryText}>Share</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setPreview(false)}
              style={[globalStyles.btnPrimary, { paddingHorizontal: 24, backgroundColor: 'transparent', borderWidth: 1, borderColor: COLORS.glassBorder }]}
            >
              <Text style={{ color: COLORS.textPrimary, fontWeight: '700' }}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  templatePicker: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    backgroundColor: COLORS.glass,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
  },
  templateIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    backgroundColor: COLORS.glass,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    marginBottom: 8,
  },
  tplRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    marginBottom: 8,
  },
  previewCard: {
    width: '100%',
    maxWidth: 360,
    borderRadius: 24,
    padding: 28,
    alignItems: 'center',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  topBorder: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 3,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    opacity: 0.8,
  },
  bottomBorder: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 3,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    opacity: 0.4,
  },
  previewContent: {
    fontSize: 20,
    lineHeight: 34,
    fontWeight: '600',
    textAlign: 'center',
  },
});
