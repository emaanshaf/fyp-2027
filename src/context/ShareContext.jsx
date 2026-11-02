import React, {
  createContext, useCallback, useContext, useEffect, useRef, useState,
} from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ShareSheet from '../components/ShareSheet';
import { useColors } from '../theme';
import { useLanguage } from './LanguageContext';
import {
  canonicalUrl, composeShareText, copyText, openInstagram, openWhatsApp, systemShare,
} from '../utils/share';

/**
 * Every screen shares through this one sheet, so the options a user sees are
 * the same whether they are sharing an ayah, a hadith or a course. Without a
 * provider (a screen mounted in isolation, or the landing flow) `share` falls
 * back to the system sheet rather than throwing.
 */
const ShareContext = createContext({
  share: payload => systemShare(payload),
});

export function ShareProvider({ children }) {
  const COLORS = useColors();
  const { t } = useLanguage();
  const [payload, setPayload] = useState(null);
  const [toast, setToast] = useState(null);
  const opacity = useRef(new Animated.Value(0)).current;
  const hideTimer = useRef(null);

  useEffect(() => () => {
    if (hideTimer.current) clearTimeout(hideTimer.current);
  }, []);

  const notify = useCallback(message => {
    if (!message) return;
    if (hideTimer.current) clearTimeout(hideTimer.current);
    setToast(message);
    opacity.stopAnimation();
    Animated.timing(opacity, { toValue: 1, duration: 170, useNativeDriver: true }).start();
    hideTimer.current = setTimeout(() => {
      Animated.timing(opacity, { toValue: 0, duration: 240, useNativeDriver: true }).start(() => {
        setToast(null);
      });
    }, 2600);
  }, [opacity]);

  const share = useCallback(data => {
    if (!data) return;
    setPayload(data);
  }, []);

  const close = useCallback(() => setPayload(null), []);

  const handleAction = useCallback(async action => {
    const data = payload;
    if (!data) return;
    setPayload(null);

    const fullText = composeShareText(data);
    const link = data.url ? canonicalUrl(data.url) : '';
    const copyValue = link || fullText;

    try {
      if (action === 'whatsapp') {
        const opened = await openWhatsApp(fullText);
        if (!opened) {
          const copied = await copyText(fullText);
          notify(copied ? t('common.copied') : t('common.copyFailed'));
        }
        return;
      }

      if (action === 'instagram') {
        // Ordered deliberately: the clipboard write must happen even if the
        // Instagram app is not installed. The note on the sheet explains it.
        const copied = await copyText(fullText);
        await openInstagram();
        notify(copied ? t('common.captionCopied') : t('common.copyFailed'));
        return;
      }

      if (action === 'copy') {
        const copied = await copyText(copyValue);
        notify(copied ? t('common.copied') : t('common.copyFailed'));
        return;
      }

      const shared = await systemShare(data);
      if (!shared) {
        const copied = await copyText(fullText);
        notify(copied ? t('common.copied') : t('common.copyFailed'));
      }
    } catch {
      const copied = await copyText(fullText).catch(() => false);
      notify(copied ? t('common.copied') : t('common.copyFailed'));
    }
  }, [payload, notify, t]);

  return (
    <ShareContext.Provider value={{ share }}>
      <View style={{ flex: 1 }}>
        {children}
        {toast ? (
          <Animated.View
            pointerEvents="none"
            style={[styles.toast, {
              opacity,
              backgroundColor: COLORS.bgCard,
              borderColor: COLORS.gold + '55',
            }]}
          >
            <Ionicons name="checkmark-circle" size={17} color={COLORS.emerald} />
            <Text style={[styles.toastText, { color: COLORS.textPrimary }]} numberOfLines={2}>
              {toast}
            </Text>
          </Animated.View>
        ) : null}
      </View>
      <ShareSheet
        visible={!!payload}
        payload={payload}
        onClose={close}
        onAction={handleAction}
      />
    </ShareContext.Provider>
  );
}

export const useShare = () => useContext(ShareContext);

const styles = StyleSheet.create({
  toast: {
    position: 'absolute', bottom: 96, alignSelf: 'center',
    flexDirection: 'row', alignItems: 'center', gap: 8,
    maxWidth: 360, marginHorizontal: 24,
    paddingHorizontal: 16, paddingVertical: 12,
    borderRadius: 14, borderWidth: 1,
    shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 }, elevation: 8,
    zIndex: 1000,
  },
  toastText: { fontSize: 12, fontWeight: '600', flexShrink: 1 },
});

export default ShareContext;
