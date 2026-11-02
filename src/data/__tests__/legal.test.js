import { LEGAL_DOCUMENTS, LEGAL_IDS, legalDocument } from '../legal';
import { APP_CONFIG } from '../../config/appConfig';

const allText = doc => [
  doc.summary,
  ...doc.sections.flatMap(s => [...(s.paragraphs || []), ...(s.bullets || [])]),
].join('\n');

describe('legal documents', () => {
  it('ships both documents the store listings require', () => {
    expect(LEGAL_IDS.sort()).toEqual(['privacy', 'terms']);
  });

  it('gives each document a title, date, summary and sections', () => {
    for (const doc of Object.values(LEGAL_DOCUMENTS)) {
      expect(doc.title).toBeTruthy();
      expect(doc.updated).toMatch(/\d{4}/);
      expect(doc.summary.length).toBeGreaterThan(40);
      expect(doc.sections.length).toBeGreaterThan(4);
      for (const section of doc.sections) {
        expect(section.title).toBeTruthy();
        expect(
          (section.paragraphs?.length || 0) + (section.bullets?.length || 0)
        ).toBeGreaterThan(0);
      }
    }
  });

  it('states the deletion path, since both stores require one', () => {
    const text = allText(LEGAL_DOCUMENTS.privacy);
    expect(text).toMatch(/delete the account/i);
    expect(text).toMatch(/Settings/);
  });

  it('does not claim data is sold', () => {
    expect(allText(LEGAL_DOCUMENTS.privacy)).toMatch(/nothing is sold/i);
  });

  it('names the live assistant provider and says history is not sent', () => {
    const text = allText(LEGAL_DOCUMENTS.privacy);
    expect(text).toMatch(/Anthropic/);
    expect(text).toMatch(/chat history is not sent/i);
  });

  it('discloses the device geocoder used for contextual duas', () => {
    const text = allText(LEGAL_DOCUMENTS.privacy);
    expect(text).toMatch(/Use my location/);
    expect(text).toMatch(/Apple Maps/);
    expect(text).toMatch(/Google Play services/);
    expect(text).toMatch(/coordinates are not sent to the Qitab-e-Noor server/i);
  });

  it('says today\u2019s reminders are shown inside the app', () => {
    expect(allText(LEGAL_DOCUMENTS.privacy)).toMatch(/main screens every five minutes/i);
  });

  it('discloses the weather provider and what it receives', () => {
    const text = allText(LEGAL_DOCUMENTS.privacy);
    expect(text).toMatch(/Open-Meteo/);
    expect(text).toMatch(/city name/i);
    expect(text).toMatch(/never your coordinates/i);
  });

  it('keeps the scholar boundary in the terms', () => {
    const text = allText(LEGAL_DOCUMENTS.terms);
    expect(text).toMatch(/not a religious authority/i);
    expect(text).toMatch(/qualified scholar/i);
    expect(text).toMatch(/do not treat its output as a fatwa/i);
  });

  it('gives the same support address the app displays', () => {
    for (const doc of Object.values(LEGAL_DOCUMENTS)) {
      expect(allText(doc)).toContain(APP_CONFIG.supportEmail);
    }
  });
});

describe('legalDocument', () => {
  it('returns the requested document', () => {
    expect(legalDocument('terms')).toBe(LEGAL_DOCUMENTS.terms);
  });

  it('defaults to the privacy policy for a missing or unknown id', () => {
    expect(legalDocument(undefined)).toBe(LEGAL_DOCUMENTS.privacy);
    expect(legalDocument('nope')).toBe(LEGAL_DOCUMENTS.privacy);
  });
});
