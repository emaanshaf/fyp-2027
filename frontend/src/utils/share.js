// Sharing helpers shared by every screen.
//
// React Native's own Share sheet is the "more" option, not the primary one:
// the app is used mostly in Pakistan and the Gulf, where WhatsApp is where a
// verse actually gets sent on, and Instagram is where it gets posted. Those
// two have no cross-platform text API, so each is handled explicitly.

import { Linking, Platform, Share } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { APP_CONFIG } from '../config/appConfig';

/** Absolute, canonical URL for any in-app path. */
export function canonicalUrl(path) {
  const value = String(path || '').trim();
  if (!value) return APP_CONFIG.appUrl;
  if (/^https?:\/\//i.test(value)) return value;
  return `${APP_CONFIG.appUrl}${value.startsWith('/') ? '' : '/'}${value}`;
}

/** Message plus canonical link, without duplicating a link already present. */
export function composeShareText({ message, url } = {}) {
  const body = String(message || '').trim();
  const link = url ? canonicalUrl(url) : '';
  if (!link) return body;
  if (body.includes(link)) return body;
  return body ? `${body}\n\n${link}` : link;
}

export function whatsappUrl(text) {
  return `https://wa.me/?text=${encodeURIComponent(String(text || ''))}`;
}

export function instagramUrl() {
  return 'https://www.instagram.com/';
}

const openExternal = async url => {
  try {
    await Linking.openURL(url);
    return true;
  } catch {
    return false;
  }
};

/**
 * Open WhatsApp with the text pre-filled.
 *
 * The `whatsapp://` scheme skips the browser hop on a phone; `wa.me` is the
 * fallback for a device without the app and the only workable form on web.
 */
export async function openWhatsApp(text) {
  const encoded = encodeURIComponent(String(text || ''));
  if (Platform.OS === 'web') {
    try {
      window.open(`https://wa.me/?text=${encoded}`, '_blank', 'noopener,noreferrer');
      return true;
    } catch {
      return false;
    }
  }
  const viaApp = await openExternal(`whatsapp://send?text=${encoded}`);
  if (viaApp) return true;
  return openExternal(`https://wa.me/?text=${encoded}`);
}

/**
 * Instagram has no share-intent URL that accepts text, and its app scheme
 * opens the feed rather than a composer. Copy the caption first so the user
 * only has to paste, then open Instagram.
 */
export async function openInstagram() {
  if (Platform.OS === 'web') {
    try {
      window.open(instagramUrl(), '_blank', 'noopener,noreferrer');
      return true;
    } catch {
      return false;
    }
  }
  const viaApp = await openExternal('instagram://app');
  if (viaApp) return true;
  return openExternal(instagramUrl());
}

/** Copy text, falling back to the browser APIs when expo-clipboard cannot. */
export async function copyText(text) {
  const value = String(text ?? '');
  try {
    await Clipboard.setStringAsync(value);
    return true;
  } catch {
    // expo-clipboard requires a secure context on web; fall through.
  }

  if (Platform.OS === 'web' && typeof navigator !== 'undefined') {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(value);
        return true;
      }
    } catch { /* permission denied; try the legacy path */ }

    try {
      const area = document.createElement('textarea');
      area.value = value;
      area.setAttribute('readonly', '');
      area.style.position = 'fixed';
      area.style.opacity = '0';
      document.body.appendChild(area);
      area.select();
      const ok = document.execCommand('copy');
      document.body.removeChild(area);
      return ok;
    } catch {
      return false;
    }
  }

  return false;
}

/** The operating system's own share sheet. */
export async function systemShare(payload = {}) {
  const text = composeShareText(payload);
  try {
    await Share.share({
      title: payload.title || APP_CONFIG.appName,
      message: text,
      ...(payload.url ? { url: canonicalUrl(payload.url) } : {}),
    });
    return true;
  } catch {
    return false;
  }
}
