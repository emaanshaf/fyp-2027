import React from 'react';
import {
  Modal, View, Text, TouchableOpacity, Pressable, StyleSheet, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '../theme';
import { useLanguage } from '../context/LanguageContext';
import { canonicalUrl } from '../utils/share';

const ACTIONS = [
  { id: 'whatsapp', icon: 'logo-whatsapp', color: '#25D366', labelKey: 'common.whatsapp' },
  { id: 'instagram', icon: 'logo-instagram', color: '#E1306C', labelKey: 'common.instagram' },
  { id: 'copy', icon: 'link-outline', color: 'gold', labelKey: 'common.copyLink' },
  { id: 'more', icon: 'share-social-outline', color: 'blue', labelKey: 'common.more' },
];

export default function ShareSheet({ visible, payload, onClose, onAction }) {
  const COLORS = useColors();
  const { t, isUrdu } = useLanguage();

  const title = payload?.title || t('common.share');
  const message = payload?.message || '';
  const link = payload?.url ? canonicalUrl(payload.url) : '';
  const instagramNote = isUrdu
    ? 'انسٹاگرام میں متن براہِ راست شیئر نہیں ہوتا، اس لیے کیپشن کاپی کر دیا جائے گا۔'
    : 'Instagram has no text-share link, so the caption is copied for you to paste.';

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <Pressable style={styles.overlay} onPress={onClose} accessibilityLabel={t('common.close')}>
        <Pressable
          style={[styles.sheet, { backgroundColor: COLORS.bgSecondary, borderColor: COLORS.glassBorder }]}
          onPress={() => {}}
        >
          <View style={[styles.handle, { backgroundColor: COLORS.borderStrong }]} />

          <View style={styles.headerRow}>
            <View style={[styles.headerIcon, { backgroundColor: COLORS.gold + '1F' }]}>
              <Ionicons name="share-social" size={18} color={COLORS.gold} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.title, { color: COLORS.textPrimary }]} numberOfLines={1}>
                {title}
              </Text>
              <Text style={[styles.subtitle, { color: COLORS.textSecondary }]} numberOfLines={2}>
                {t('common.shareHint')}
              </Text>
            </View>
            <TouchableOpacity
              onPress={onClose}
              style={[styles.closeBtn, { backgroundColor: COLORS.glass }]}
              accessibilityRole="button"
              accessibilityLabel={t('common.close')}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="close" size={18} color={COLORS.textSecondary} />
            </TouchableOpacity>
          </View>

          {message ? (
            <View style={[styles.preview, { backgroundColor: COLORS.glass, borderColor: COLORS.glassBorder }]}>
              <Text style={[styles.previewText, { color: COLORS.textSecondary }]} numberOfLines={3}>
                {message}
              </Text>
              {link ? (
                <View style={styles.linkRow}>
                  <Ionicons name="link" size={11} color={COLORS.gold} />
                  <Text style={[styles.linkText, { color: COLORS.gold }]} numberOfLines={1}>
                    {link}
                  </Text>
                </View>
              ) : null}
            </View>
          ) : null}

          <View style={styles.actions}>
            {ACTIONS.map(action => {
              const color = action.color === 'gold' ? COLORS.gold
                : action.color === 'blue' ? COLORS.blue
                : action.color;
              return (
                <TouchableOpacity
                  key={action.id}
                  style={styles.action}
                  activeOpacity={0.72}
                  onPress={() => onAction(action.id)}
                  accessibilityRole="button"
                  accessibilityLabel={t(action.labelKey)}
                >
                  <View style={[styles.actionIcon, {
                    backgroundColor: color + '1F',
                    borderColor: color + '45',
                  }]}>
                    <Ionicons name={action.icon} size={25} color={color} />
                  </View>
                  <Text style={[styles.actionLabel, { color: COLORS.textPrimary }]}>
                    {t(action.labelKey)}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <Text style={[styles.note, { color: COLORS.textSecondary }]}>{instagramNote}</Text>

          <TouchableOpacity
            style={[styles.cancel, { backgroundColor: COLORS.glass, borderColor: COLORS.glassBorder }]}
            onPress={onClose}
            accessibilityRole="button"
          >
            <Text style={[styles.cancelText, { color: COLORS.textSecondary }]}>{t('common.cancel')}</Text>
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.66)',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  sheet: {
    width: '100%',
    maxWidth: Platform.OS === 'web' ? 520 : undefined,
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    borderWidth: 1,
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: Platform.OS === 'web' ? 26 : 34,
  },
  handle: { alignSelf: 'center', width: 42, height: 4, borderRadius: 2, marginBottom: 16 },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  headerIcon: {
    width: 40, height: 40, borderRadius: 13,
    alignItems: 'center', justifyContent: 'center',
  },
  title: { fontSize: 16, fontWeight: '900' },
  subtitle: { fontSize: 11, lineHeight: 15, marginTop: 2 },
  closeBtn: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  preview: {
    borderRadius: 14, borderWidth: 1, padding: 12, marginTop: 16,
  },
  previewText: { fontSize: 12, lineHeight: 18 },
  linkRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 8 },
  linkText: { fontSize: 10.5, fontWeight: '700', flex: 1 },
  actions: { flexDirection: 'row', marginTop: 20, marginBottom: 6 },
  action: { flex: 1, alignItems: 'center', gap: 8 },
  actionIcon: {
    width: 58, height: 58, borderRadius: 18, borderWidth: 1,
    alignItems: 'center', justifyContent: 'center',
  },
  actionLabel: { fontSize: 10.5, fontWeight: '700', textAlign: 'center' },
  note: { fontSize: 9.5, lineHeight: 14, textAlign: 'center', marginTop: 10, opacity: 0.75 },
  cancel: {
    marginTop: 14, borderRadius: 14, borderWidth: 1,
    alignItems: 'center', paddingVertical: 13,
  },
  cancelText: { fontSize: 13, fontWeight: '700' },
});
