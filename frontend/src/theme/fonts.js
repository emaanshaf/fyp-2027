/* global require */
// Bundled script fonts. Both are OFL-licensed and live in assets/fonts.
//
// Amiri Quran is drawn for Uthmani text: the diacritics have room, unlike a
// system fallback that clips them. Noto Nastaliq Urdu is the script's proper
// hand; the Latin system font renders Urdu legibly but not correctly.
export const FONT_ASSETS = {
  AmiriQuran: require('../../assets/fonts/AmiriQuran-Regular.ttf'),
  NotoNastaliqUrdu: require('../../assets/fonts/NotoNastaliqUrdu.ttf'),
};

export const FONT_FAMILY = {
  quran: 'AmiriQuran',
  arabic: 'AmiriQuran',
  urdu: 'NotoNastaliqUrdu',
};

export default FONT_ASSETS;
