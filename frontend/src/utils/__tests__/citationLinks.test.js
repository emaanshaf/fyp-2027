import { parseQuranCitation } from '../citationLinks';

describe('parseQuranCitation', () => {
  it('parses a named surah with an ayah', () => {
    expect(parseQuranCitation('Surah Al-Baqarah 2:255')).toEqual({ surah: 2, ayah: 255 });
  });

  it('parses a named surah without an ayah', () => {
    expect(parseQuranCitation('Surah Yaseen 36')).toEqual({ surah: 36, ayah: null });
  });

  it('takes the first ayah of a range', () => {
    expect(parseQuranCitation('Surah Al-Baqarah 2:183-185')).toEqual({ surah: 2, ayah: 183 });
  });

  it('parses the short Quran forms used in live answers', () => {
    expect(parseQuranCitation('Quran 2:153')).toEqual({ surah: 2, ayah: 153 });
    expect(parseQuranCitation("Qur'an 2:153")).toEqual({ surah: 2, ayah: 153 });
  });

  it('handles surah names containing apostrophes and hyphens', () => {
    expect(parseQuranCitation("Surah Al-Ma'idah 5:6")).toEqual({ surah: 5, ayah: 6 });
    expect(parseQuranCitation('Surah An-Nisa 4:31')).toEqual({ surah: 4, ayah: 31 });
  });

  it('rejects hadith and book references', () => {
    expect(parseQuranCitation('Sahih Bukhari 8')).toBeNull();
    expect(parseQuranCitation('Tirmidhi 413')).toBeNull();
    expect(parseQuranCitation('Fiqh al-Zakat by Yusuf al-Qaradawi')).toBeNull();
  });

  it('rejects an impossible surah number', () => {
    expect(parseQuranCitation('Surah Unknown 200:1')).toBeNull();
  });

  it('rejects empty and non-string input', () => {
    expect(parseQuranCitation('')).toBeNull();
    expect(parseQuranCitation(null)).toBeNull();
    expect(parseQuranCitation(42)).toBeNull();
  });
});
