import {
  buildChain, collectorFor, graderFor, gradeMeaning,
  COLLECTORS, TRANSMISSION_STAGES,
} from '../isnad';

/**
 * The chain UI makes claims about who transmitted a hadith. The rule this
 * file exists to enforce is that it never names a narrator we do not have:
 * an unknown link must come back `known: false` so the screen can say so.
 */

describe('transmission chain', () => {
  it('runs from the Prophet to the collector', () => {
    expect(TRANSMISSION_STAGES[0].key).toBe('prophet');
    expect(TRANSMISSION_STAGES[TRANSMISSION_STAGES.length - 1].key).toBe('collector');
  });

  it('names the collector for a known collection', () => {
    const chain = buildChain({ collectionId: 'eng-muslim' });
    const collector = chain.find(c => c.key === 'collector');
    expect(collector.known).toBe(true);
    expect(collector.person).toMatch(/Muslim ibn al-Hajjaj/);
  });

  it('names the companion only when one was supplied', () => {
    const withNarrator = buildChain({
      collectionId: 'eng-bukhari', companion: 'Umar ibn al-Khattab (RA)',
    });
    expect(withNarrator.find(c => c.key === 'sahabi')).toMatchObject({
      known: true, person: 'Umar ibn al-Khattab (RA)',
    });

    const without = buildChain({ collectionId: 'eng-bukhari' });
    expect(without.find(c => c.key === 'sahabi').known).toBe(false);
    expect(without.find(c => c.key === 'sahabi').person).toBeUndefined();
  });

  it('never invents the intermediate narrators', () => {
    // These links exist in print but not in our data. If they ever come back
    // `known: true` with a name, something has started fabricating isnad.
    const chain = buildChain({
      collectionId: 'eng-bukhari', companion: 'Anas ibn Malik (RA)',
    });
    for (const key of ['tabii', 'atba']) {
      const link = chain.find(c => c.key === key);
      expect(link.known).toBe(false);
      expect(link.person).toBeUndefined();
    }
  });

  it('handles an unknown collection without throwing', () => {
    const chain = buildChain({ collectionId: 'not-a-collection' });
    expect(chain).toHaveLength(TRANSMISSION_STAGES.length);
    expect(chain.find(c => c.key === 'collector').known).toBe(false);
  });
});

describe('collector biographies', () => {
  it('covers all six canonical collections', () => {
    expect(Object.keys(COLLECTORS)).toHaveLength(6);
    for (const c of Object.values(COLLECTORS)) {
      expect(c.name).toBeTruthy();
      expect(c.arabic).toBeTruthy();
      expect(c.lived).toMatch(/AH/);
      expect(c.criteria.length).toBeGreaterThan(40);
    }
  });

  it('resolves a collector by collection id', () => {
    expect(collectorFor('eng-bukhari').work).toBe('Sahih al-Bukhari');
    expect(collectorFor('nope')).toBeNull();
  });
});

describe('grades', () => {
  it('explains what a grade means', () => {
    expect(gradeMeaning('Sahih')).toMatch(/Authentic/);
    expect(gradeMeaning('Hasan')).toMatch(/Sound/);
    expect(gradeMeaning('Da`if')).toMatch(/Weak/);
  });

  it('returns null rather than a wrong explanation for an unknown grade', () => {
    expect(gradeMeaning('Not graded')).toBeNull();
    expect(gradeMeaning(null)).toBeNull();
  });

  it('identifies a grading scholar', () => {
    expect(graderFor('Al-Albani').name).toMatch(/Albani/);
    expect(graderFor(null)).toBeNull();
  });
});
