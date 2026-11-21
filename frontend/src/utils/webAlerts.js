// A usable Alert on the web.
//
// react-native-web ships Alert as a class whose `alert()` is an empty function
// (`static alert() {}`), so every confirmation, download notice and delete
// prompt in the app silently did nothing in a browser. Rather than fork each
// call site, this installs the browser equivalents once at startup:
//
//   no buttons  → window.alert
//   one button  → window.alert, then its onPress
//   two buttons → window.confirm, choosing the cancel or the action
//   three+      → window.prompt with a numbered menu
//
// Native builds keep the real system alert; the installer is a no-op there.

import { Alert, Platform } from 'react-native';

const messageText = (title, message) => [title, message].filter(Boolean).join('\n\n');

function press(button) {
  try {
    Promise.resolve(button?.onPress?.()).catch(() => {});
  } catch {
    // A throwing handler must not leave the dialog's promise unhandled.
  }
}

/**
 * Render an Alert through browser dialogs.
 *
 * Exported separately from the installer so the button mapping can be tested
 * without touching the shared Alert object.
 *
 * @param {string} title
 * @param {string} [message]
 * @param {Array<{text: string, style?: string, onPress?: Function}>} [buttons]
 * @param {{alert: Function, confirm: Function, prompt: Function}} dialogs
 */
export function showWebAlert(title, message, buttons, dialogs) {
  const list = Array.isArray(buttons) ? buttons : [];
  const text = messageText(title, message);

  if (list.length === 0) {
    dialogs.alert(text);
    return;
  }

  if (list.length === 1) {
    dialogs.alert(text);
    press(list[0]);
    return;
  }

  if (list.length === 2) {
    const cancel = list.find(button => button.style === 'cancel') || list[0];
    const action = list.find(button => button !== cancel) || list[1];
    const accepted = dialogs.confirm(
      `${text}\n\nOK: ${action.text}\nCancel: ${cancel.text}`
    );
    press(accepted ? action : cancel);
    return;
  }

  const menu = list.map((button, index) => `${index + 1}. ${button.text}`).join('\n');
  const answer = dialogs.prompt(`${text}\n\n${menu}\n\nType the number of your choice:`, '');
  const chosen = Number.parseInt(answer, 10) - 1;
  if (Number.isInteger(chosen) && list[chosen]) press(list[chosen]);
}

/** Replace the web no-op once; returns true when the shim was installed. */
export function installWebAlertFallback() {
  if (Platform.OS !== 'web') return false;
  if (typeof window === 'undefined') return false;
  if (Alert.__qitabWebFallback) return false;

  Alert.alert = (title, message, buttons) => {
    showWebAlert(title, message, buttons, {
      alert: text => window.alert(text),
      confirm: text => window.confirm(text),
      prompt: (text, initial) => window.prompt(text, initial),
    });
  };
  Alert.__qitabWebFallback = true;
  return true;
}
