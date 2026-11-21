import { getAIAnswer, findQuranVerses } from '../assistant';
import { askClaude, isClaudeConfigured, claudeStatus } from '../claudeClient';
import { KNOWLEDGE_BASE } from '../islamicKnowledge';
import quranService from '../../services/quranApi';

jest.mock('../claudeClient', () => ({
  askClaude: jest.fn(),
  isClaudeConfigured: jest.fn(() => true),
  claudeStatus: jest.fn(() => ({ ok: false, reason: 'no_key', message: 'No live assistant configured.' })),
}));

// The assistant searches Quran translations when the knowledge base has no
// match. Without this mock every such test would make a real network call and
// wait for the 5.5s timeout.
jest.mock('../../services/quranApi', () => ({
  __esModule: true,
  default: { search: jest.fn(), getChapters: jest.fn() },
}));

const verse = (verseKey, text) => ({
  verse_key: verseKey,
  translations: [{ text }],
});

beforeEach(() => {
  jest.clearAllMocks();
  isClaudeConfigured.mockReturnValue(true);
  claudeStatus.mockReturnValue({ ok: false, reason: 'no_key', message: 'No live assistant configured.' });
  quranService.search.mockResolvedValue([]);
  quranService.getChapters.mockResolvedValue([]);
});

describe('the offline knowledge base', () => {
  it('is actually bundled with the app', () => {
    expect(KNOWLEDGE_BASE.length).toBeGreaterThan(100);
  });

  it('gives every entry the fields the UI renders', () => {
    for (const entry of KNOWLEDGE_BASE) {
      expect(typeof entry.topic).toBe('string');
      expect(entry.topic.length).toBeGreaterThan(0);
      expect(typeof entry.answer).toBe('string');
      expect(entry.answer.length).toBeGreaterThan(0);
      expect(Array.isArray(entry.keywords)).toBe(true);
      expect(Array.isArray(entry.references)).toBe(true);
    }
  });

  it('has no duplicate topics', () => {
    const topics = KNOWLEDGE_BASE.map(e => e.topic);
    expect(new Set(topics).size).toBe(topics.length);
  });
});

describe('getAIAnswer with the live assistant available', () => {
  it('returns the live answer and marks it as such', async () => {
    askClaude.mockResolvedValue('Zakat is 2.5% of qualifying wealth held for a lunar year.');

    const result = await getAIAnswer('What is zakat?');

    expect(result.text).toMatch(/2\.5%/);
    expect(result.source).toMatch(/^claude/);
  });

  it('grounds the live call in retrieved offline context', async () => {
    askClaude.mockResolvedValue('answer');

    await getAIAnswer('What is zakat?');

    const [question, options] = askClaude.mock.calls[0];
    expect(question).toBe('What is zakat?');
    // Retrieval runs regardless of whether Claude is reachable, so the same
    // entries either ground the live answer or become the offline one.
    expect(Array.isArray(options.context)).toBe(true);
    expect(options.context.length).toBeGreaterThan(0);
  });

  it('offers follow-up topics with every live answer', async () => {
    askClaude.mockResolvedValue('answer');

    const result = await getAIAnswer('What is zakat?');

    expect(Array.isArray(result.followUps)).toBe(true);
    expect(result.followUps.length).toBeGreaterThan(0);
    expect(result.followUps.length).toBeLessThanOrEqual(3);
  });
});

// This is the path every user is on today: no key is configured anywhere, so
// the app has to answer from the bundled knowledge base and say why.
describe('getAIAnswer falling back offline', () => {
  it('answers from the knowledge base when the live call fails', async () => {
    askClaude.mockRejectedValue(new Error('Backend server not available'));

    const result = await getAIAnswer('What is zakat?');

    expect(result.source).toBe('offline');
    expect(result.text.length).toBeGreaterThan(0);
    expect(result.topic).toBeTruthy();
  });

  it('explains why the answer is offline rather than degrading silently', async () => {
    askClaude.mockRejectedValue(new Error('Backend server not available'));

    const result = await getAIAnswer('How do I perform wudu?');

    expect(result.offlineReason).toBeTruthy();
  });

  it('does not attempt a live call when the server has no key', async () => {
    isClaudeConfigured.mockReturnValue(false);

    const result = await getAIAnswer('What is zakat?');

    expect(askClaude).not.toHaveBeenCalled();
    expect(result.source).toBe('offline');
  });

  it('always gives the user a next step, even for a niche topic', async () => {
    isClaudeConfigured.mockReturnValue(false);

    const result = await getAIAnswer('what is backbiting?');

    expect(result.followUps.length).toBeGreaterThan(0);
    expect(result.followUps.length).toBeLessThanOrEqual(3);
  });

  it.each([
    'What are the Five Pillars of Islam?',
    'How do I perform Wudu?',
    'What is Nisab for Zakat?',
    'What is Riba in Islam?',
    'What should I do if I miss Fajr?',
    'Is music haram?',
    'I feel anxious and depressed',
    'I want to kill myself',
  ])('answers the suggested question %p offline', async (question) => {
    isClaudeConfigured.mockReturnValue(false);

    const result = await getAIAnswer(question);

    // These are the prompts the chat screen offers as chips. A user tapping
    // one must never get "I don't know".
    expect(result.source).toBe('offline');
    expect(result.text.length).toBeGreaterThan(40);
  });
});

describe('questions about what the Quran says', () => {
  it('answers the subject instead of the general Quran introduction', async () => {
    isClaudeConfigured.mockReturnValue(false);

    const result = await getAIAnswer('What does the Quran say about patience?');

    expect(result.source).toBe('offline');
    expect(result.topic).toBe('Sabr (Patience) & Trials');
  });

  it('searches translations with the subject, not the word quran', async () => {
    isClaudeConfigured.mockReturnValue(false);
    quranService.search.mockResolvedValue([verse('78:7', 'And the mountains as stakes?')]);
    quranService.getChapters.mockResolvedValue([{ id: 78, name_simple: 'An-Naba' }]);

    const result = await getAIAnswer('What does the Quran say about mountains?');

    expect(result.source).toBe('offline+quran');
    expect(result.text).toContain('And the mountains as stakes');
    expect(quranService.search.mock.calls.map(([term]) => term)).toEqual(['mountains']);
  });

  it('still answers a general question about the Quran itself', async () => {
    isClaudeConfigured.mockReturnValue(false);

    const result = await getAIAnswer('What is the Quran?');

    expect(result.topic).toBe('The Holy Quran');
  });
});

describe('Quran translation fallback', () => {
  it('returns verses when the knowledge base has nothing', async () => {
    isClaudeConfigured.mockReturnValue(false);
    quranService.search.mockResolvedValue([
      verse('2:286', 'Allah does not burden a soul beyond what it can bear.'),
    ]);
    quranService.getChapters.mockResolvedValue([{ id: 2, name_simple: 'Al-Baqarah' }]);

    const result = await getAIAnswer('zzzzqqq unmatchable gibberish string');

    expect(result.source).toBe('offline+quran');
    expect(result.text).toContain('Allah does not burden a soul');
    expect(result.references[0]).toContain('Al-Baqarah');
  });

  it('is explicit that search output is not a fatwa', async () => {
    quranService.search.mockResolvedValue([verse('2:286', 'A verse about patience.')]);
    quranService.getChapters.mockResolvedValue([{ id: 2, name_simple: 'Al-Baqarah' }]);

    const result = await findQuranVerses('unmatchable gibberish string');

    expect(result.text).toMatch(/not a legal ruling/i);
    expect(result.text).toMatch(/qualified scholar/i);
  });

  it('strips HTML and entities from the API translation', async () => {
    quranService.search.mockResolvedValue([
      verse('2:286', '<p>Allah doesn&apos;t burden a soul.</p>'),
    ]);
    quranService.getChapters.mockResolvedValue([{ id: 2, name_simple: 'Al-Baqarah' }]);

    const result = await findQuranVerses('unmatchable gibberish string');

    expect(result.text).toContain("Allah doesn't burden a soul.");
    expect(result.text).not.toContain('<p>');
  });

  it('returns null when no verse matches so the caller can be honest', async () => {
    expect(await findQuranVerses('unmatchable gibberish string')).toBeNull();
  });
});

describe('conversational openings', () => {
  it.each(['hi', 'hello', 'Assalamu alaikum!', 'salaam'])(
    'greets warmly instead of reporting no match for %p',
    async question => {
      isClaudeConfigured.mockReturnValue(false);

      const result = await getAIAnswer(question);

      expect(result.source).toBe('offline');
      expect(result.topic).toBe('Greeting');
      expect(result.text.length).toBeGreaterThan(40);
      expect(result.text).not.toMatch(/not found/i);
      expect(result.followUps.length).toBeGreaterThan(0);
    }
  );

  it('does not spend a live call or a Quran search on a greeting', async () => {
    isClaudeConfigured.mockReturnValue(true);

    await getAIAnswer('hi');

    expect(askClaude).not.toHaveBeenCalled();
    expect(quranService.search).not.toHaveBeenCalled();
  });

  it('still answers a real question that starts with a greeting', async () => {
    isClaudeConfigured.mockReturnValue(false);

    const result = await getAIAnswer('Hi, what is zakat?');

    expect(result.topic).toMatch(/zakat/i);
  });

  it.each([
    ['thanks', /welcome/i],
    ['help', /assistant/i],
    ['how are you', /alhamdulillah/i],
    ['bye', /fi amanillah/i],
  ])('handles the conversational message %p', async (question, pattern) => {
    isClaudeConfigured.mockReturnValue(false);

    const result = await getAIAnswer(question);

    expect(result.text).toMatch(pattern);
    expect(result.topic).not.toBe('No exact match');
  });
});

describe('when nothing matches', () => {
  it('uses a user-facing label instead of "Not Found"', async () => {
    isClaudeConfigured.mockReturnValue(false);

    const result = await getAIAnswer('zzzzqqq unmatchable gibberish string');

    expect(result.topic).toBe('No exact match');
    expect(result.text).not.toMatch(/not found/i);
  });

  it('does not blame the network when no Quran search could run', async () => {
    isClaudeConfigured.mockReturnValue(false);

    // Two letters: the search filter drops it before any request.
    const result = await getAIAnswer('xy');

    expect(result.source).toBe('unavailable');
    expect(result.text).not.toMatch(/you may be offline/i);
    expect(result.text).not.toMatch(/couldn't find a related Quran translation/i);
    expect(result.text).toMatch(/rephrasing/i);
  });

  it('mentions the translation search only when one actually ran', async () => {
    isClaudeConfigured.mockReturnValue(false);

    const result = await getAIAnswer('zzzzqqq unmatchable gibberish string');

    expect(result.text).toMatch(/Quran translation/i);
  });
});

describe('getAIAnswer edge cases', () => {
  it.each([['empty', ''], ['whitespace', '   '], ['null', null], ['undefined', undefined]])(
    'returns null for a %s question', async (_label, question) => {
      expect(await getAIAnswer(question)).toBeNull();
    });

  it('says so plainly when nothing matches and the live call fails', async () => {
    isClaudeConfigured.mockReturnValue(false);

    const result = await getAIAnswer('zzzzqqq unmatchable gibberish string');

    // Returning null here rendered as no reply at all in the chat screen.
    expect(result).not.toBeNull();
    expect(result.text.length).toBeGreaterThan(0);
    expect(result.source).toBe('unavailable');
    expect(result.followUps.length).toBeGreaterThan(0);
  });

  it('still answers offline when the Quran search itself throws', async () => {
    isClaudeConfigured.mockReturnValue(false);
    quranService.search.mockRejectedValue(new Error('offline'));

    const result = await getAIAnswer('zzzzqqq unmatchable gibberish string');

    expect(result.source).toBe('unavailable');
    expect(result.text).toMatch(/offline|rephrasing/i);
  });
});
