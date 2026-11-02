const {
  mineNews,
  matchTopics,
  extractKeywords,
  buildTrending,
  tokenize,
} = require('../services/newsTextMining');

const story = (title, summary = '', overrides = {}) => ({
  id: `https://example.com/${encodeURIComponent(title)}`,
  title,
  summary,
  url: 'https://example.com/story',
  categories: [],
  source: { id: 'al-jazeera', name: 'Al Jazeera', homepage: 'https://www.aljazeera.com' },
  ...overrides,
});

describe('news text mining', () => {
  it('drops stop words and publisher boilerplate from tokens', () => {
    const tokens = tokenize('Al Jazeera reports that the mosque was full of pilgrims');
    expect(tokens).toEqual(expect.arrayContaining(['mosque', 'full', 'pilgrims']));
    expect(tokens).not.toContain('the');
    expect(tokens).not.toContain('jazeera');
    expect(tokens).not.toContain('reports');
  });

  it('does not leave fragments of contractions behind', () => {
    const tokens = tokenize('Arab voice doesn’t count, but worshippers aren’t silent');
    expect(tokens).not.toContain('doesn');
    expect(tokens).not.toContain('aren');
    expect(tokens).toContain('worshippers');
  });

  it('matches curated topics from title and body text', () => {
    expect(matchTopics('Hajj pilgrims arrive in Makkah')).toContain('Hajj & Umrah');
    expect(matchTopics('Mosques announce iftar times for Ramadan')).toEqual(
      expect.arrayContaining(['Ramadan', 'Mosques'])
    );
    expect(matchTopics('Central bank raises interest rates')).not.toContain('Gaza');
  });

  it('extracts title-cased keywords without stop words', () => {
    const keywords = extractKeywords(
      story('Gaza hospitals face fuel shortages', 'Medics warn of a growing crisis in Gaza.')
    );

    expect(keywords).toContain('Gaza');
    expect(keywords).toContain('Hospitals');
    expect(keywords.length).toBeLessThanOrEqual(4);
    expect(keywords.some(word => ['The', 'Of', 'In'].includes(word))).toBe(false);
  });

  it('counts a trend once per story, not once per mention', () => {
    const items = [
      story('Gaza ceasefire talks resume', 'Gaza mediators meet again in Cairo.'),
      story('Aid reaches Gaza hospitals', 'Supplies enter Gaza through the crossing.'),
      story('Ramadan begins next week', 'Mosques prepare iftar programmes.'),
      story('Election results announced', 'Parliament reconvenes on Monday.'),
      story('Oil prices rise', 'Markets react to supply changes.'),
    ];

    const trending = buildTrending(items.map(item => ({ ...item, keywords: [], topics: [] })));
    const gaza = trending.find(entry => entry.label === 'Gaza');

    expect(gaza).toMatchObject({ kind: 'topic', count: 2 });
    expect(trending.some(entry => entry.label === 'Ramadan')).toBe(false);
  });

  it('annotates stories and returns trends in one pass', () => {
    const items = [
      story('Gaza ceasefire talks resume', 'Mediators meet in Cairo.'),
      story('Aid convoy enters Gaza', 'Hospitals receive medical supplies.'),
    ];

    const mined = mineNews(items);

    expect(mined.items).toHaveLength(2);
    expect(mined.items[0].topics).toContain('Gaza');
    expect(mined.items[0].keywords.length).toBeGreaterThan(0);
    expect(mined.trending).toEqual(
      expect.arrayContaining([expect.objectContaining({ label: 'Gaza', count: 2 })])
    );
    // The input is not mutated.
    expect(items[0].topics).toBeUndefined();
  });

  it('handles an empty or malformed feed', () => {
    expect(mineNews([])).toEqual({ items: [], trending: [] });
    expect(mineNews(null)).toEqual({ items: [], trending: [] });
    expect(mineNews([story('   ')])).toMatchObject({ items: expect.any(Array), trending: [] });
  });
});
