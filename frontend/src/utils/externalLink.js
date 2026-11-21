// Opening an address outside the app.
//
// On the web preview a new tab keeps the app open; handing an ordinary https
// address to Linking there can replace the page the app is running in. On a
// phone Linking passes the address to the system browser. Both paths report
// success so a caller can show the address when no browser is available.

import { Linking, Platform } from 'react-native';

export async function openExternalUrl(url) {
  const address = String(url || '').trim();
  if (!address) return false;

  if (Platform.OS === 'web' && typeof window !== 'undefined' && typeof window.open === 'function') {
    try {
      // Some embedded browsers ignore the target and reuse the tab, so a null
      // return is not treated as a failure.
      const opened = window.open(address, '_blank');
      if (opened) {
        opened.opener = null;
        return true;
      }
      // Popup blocked: fall through to Linking, which is the only other option.
    } catch {
      // Fall through to Linking as well.
    }
  }

  try {
    await Linking.openURL(address);
    return true;
  } catch {
    return false;
  }
}
