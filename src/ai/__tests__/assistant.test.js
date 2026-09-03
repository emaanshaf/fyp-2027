import { getAIAnswer } from '../assistant';
import { askClaude, isClaudeConfigured, claudeStatus } from '../claudeClient';
import { KNOWLEDGE_BASE } from '../islamicKnowledge';

jest.mock('../claudeClient', () => ({
  askClaude: jest.fn(),
  isClaudeConfigured: jest.fn(() => true),
  claudeStatus: jest.fn(() => ({ ok: false, reason: 'no_key', message: 'No live assistant configured.' })),
}));

beforeEach(() => {
  jest.clearAllMocks();
  isClaudeConfigured.mockReturnValue(true);
  claudeStatus.mockReturnValue({ ok: false, reason: 'no_key', message: 'No live assistant configured.' });
});

describe('the offline knowledge base', () => {
  it('is actually bundled with the app', () => {
    expect(KNOWLEDGE_BASE.length).toBeGreaterThan(20);
  });

  it('gives every entry the fields the UI renders', () => {
    for (const entry of KNOWLEDGE_BASE) {
      expect(typeof entry.topic).toBe('string');
      expect(entry.topic.length).toBeGreaterThan(0);
      expect(typeof entry.answer).toBe('string');
      expect(entry.answer.length).toBeGreaterThan(0);
    }
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

  it.each([
    'What are the Five Pillars of Islam?',
    'How do I perform Wudu?',
    'What is Nisab for Zakat?',
    'What is Riba in Islam?',
  ])('answers the suggested question %p offline', async (question) => {
    isClaudeConfigured.mockReturnValue(false);

    const result = await getAIAnswer(question);

    // These are the prompts the chat screen offers as chips. A user tapping
    // one must never get "I don't know".
    expect(result.source).toBe('offline');
    expect(result.text.length).toBeGreaterThan(40);
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
    expect(['offline', 'unavailable']).toContain(result.source);
  });
});
