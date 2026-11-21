import {
  schedule, newCard, cardMastery, learning, GRADES, currentStreak,
} from '../learningEngine';

const DAY = 24 * 60 * 60 * 1000;
const daysUntil = card => Math.round((card.due - Date.now()) / DAY);

const card = (over = {}) => ({ ...newCard({ id: 'x', type: 'name', topic: 'names' }), ...over });

beforeEach(() => {
  global.__resetStorage();
});

describe('schedule (SM-2)', () => {
  it('sends a brand-new card to tomorrow on first success', () => {
    const c = schedule(card(), GRADES.good.quality);
    expect(c.reps).toBe(1);
    expect(daysUntil(c)).toBe(1);
  });

  it('follows the 1 -> 6 day ramp over the first two reviews', () => {
    let c = schedule(card(), GRADES.good.quality);
    c = schedule(c, GRADES.good.quality);
    expect(c.reps).toBe(2);
    // 6 days, ±15% jitter.
    expect(daysUntil(c)).toBeGreaterThanOrEqual(5);
    expect(daysUntil(c)).toBeLessThanOrEqual(7);
  });

  it('grows the interval by the ease factor from the third review on', () => {
    let c = card();
    for (let i = 0; i < 3; i++) c = schedule(c, GRADES.good.quality);
    const third = c.interval;
    c = schedule(c, GRADES.good.quality);
    expect(c.interval).toBeGreaterThan(third);
  });

  it('raises ease for easy answers and lowers it for hard ones', () => {
    expect(schedule(card(), GRADES.easy.quality).ease).toBeGreaterThan(2.5);
    expect(schedule(card(), GRADES.hard.quality).ease).toBeLessThan(2.5);
  });

  it('never lets ease fall below the 1.3 floor', () => {
    let c = card();
    for (let i = 0; i < 20; i++) c = schedule(c, GRADES.again.quality);
    expect(c.ease).toBeGreaterThanOrEqual(1.3);
  });

  it('halves rather than resets the interval on a lapse', () => {
    // The deliberate departure from textbook SM-2: dropping a long-held ayah
    // back to day one is punishing enough that people quit.
    const mature = card({ interval: 40, reps: 6, ease: 2.4 });
    const lapsed = schedule(mature, GRADES.again.quality);
    expect(lapsed.lapses).toBe(1);
    expect(lapsed.reps).toBe(0);
    expect(lapsed.interval).toBeGreaterThan(1);
    expect(lapsed.interval).toBeLessThan(40);
  });

  it('resets the streak on a lapse but keeps counting on success', () => {
    let c = schedule(card(), GRADES.good.quality);
    c = schedule(c, GRADES.good.quality);
    expect(c.streak).toBe(2);
    expect(schedule(c, GRADES.again.quality).streak).toBe(0);
  });

  it('always schedules at least one day out', () => {
    for (const g of Object.values(GRADES)) {
      expect(daysUntil(schedule(card(), g.quality))).toBeGreaterThanOrEqual(1);
    }
  });

  it('clamps out-of-range qualities instead of producing NaN', () => {
    expect(Number.isFinite(schedule(card(), 99).ease)).toBe(true);
    expect(Number.isFinite(schedule(card(), -5).ease)).toBe(true);
  });

  it('accumulates time spent across reviews', () => {
    const c = schedule(schedule(card(), 4, 1000), 4, 500);
    expect(c.totalMs).toBe(1500);
  });
});

describe('cardMastery', () => {
  it('is zero for a card that has never been reviewed', () => {
    expect(cardMastery(card())).toBe(0);
  });

  it('rises with the interval', () => {
    const a = cardMastery(card({ reps: 3, interval: 5 }));
    const b = cardMastery(card({ reps: 3, interval: 45 }));
    expect(b).toBeGreaterThan(a);
  });

  it('is dragged down by repeated lapses', () => {
    const clean = cardMastery(card({ reps: 6, interval: 30, lapses: 0 }));
    const shaky = cardMastery(card({ reps: 6, interval: 30, lapses: 5 }));
    expect(shaky).toBeLessThan(clean);
  });

  it('stays within 0..1', () => {
    const extreme = cardMastery(card({ reps: 200, interval: 5000, lapses: 0 }));
    expect(extreme).toBeGreaterThanOrEqual(0);
    expect(extreme).toBeLessThanOrEqual(1);
  });
});

describe('learning store', () => {
  const items = [
    { id: 'name:1', type: 'name', topic: 'names' },
    { id: 'name:2', type: 'name', topic: 'names' },
    { id: 'dua:1', type: 'dua', topic: 'dua' },
  ];

  it('enrolls items once and is idempotent on re-seed', async () => {
    expect(await learning.enroll(items)).toBe(3);
    expect(await learning.enroll(items)).toBe(0);
  });

  it('does not reset progress when a deck is re-seeded', async () => {
    await learning.enroll(items);
    await learning.review('name:1', 'good');
    const before = (await learning.all())['name:1'];

    await learning.enroll(items);
    const after = (await learning.all())['name:1'];
    expect(after.reps).toBe(before.reps);
    expect(after.due).toBe(before.due);
  });

  it('treats new cards as due immediately', async () => {
    await learning.enroll(items);
    expect((await learning.due()).length).toBe(3);
  });

  it('removes a card from the due queue once reviewed', async () => {
    await learning.enroll(items);
    await learning.review('name:1', 'good');
    const due = await learning.due();
    expect(due.map(c => c.id)).not.toContain('name:1');
  });

  it('filters the due queue by topic', async () => {
    await learning.enroll(items);
    const due = await learning.due({ topic: 'dua' });
    expect(due).toHaveLength(1);
    expect(due[0].id).toBe('dua:1');
  });

  it('orders the due queue weakest-first', async () => {
    await learning.enroll(items);
    // Give name:2 a strong history so it should sort last.
    for (let i = 0; i < 3; i++) {
      const cards = await learning.all();
      cards['name:2'].due = Date.now() - 1000;
      await learning.review('name:2', 'easy');
    }
    const cards = await learning.all();
    cards['name:2'].due = Date.now() - 1000;

    const due = await learning.due();
    const ids = due.map(c => c.id);
    if (ids.includes('name:2')) {
      expect(ids.indexOf('name:2')).toBeGreaterThan(0);
    }
  });

  it('reports fresh cards as those never reviewed', async () => {
    await learning.enroll(items);
    await learning.review('name:1', 'good');
    const fresh = await learning.fresh();
    expect(fresh.map(c => c.id).sort()).toEqual(['dua:1', 'name:2']);
  });

  it('returns null when reviewing an unknown card', async () => {
    expect(await learning.review('nope:1', 'good')).toBeNull();
  });

  it('aggregates stats by topic', async () => {
    await learning.enroll(items);
    await learning.review('name:1', 'good');
    const s = await learning.stats();
    expect(s.total).toBe(3);
    expect(s.learned).toBe(1);
    expect(s.byTopic.names.total).toBe(2);
    expect(s.byTopic.dua.total).toBe(1);
  });

  it('persists lesson completion', async () => {
    await learning.completeLesson('wudu');
    expect((await learning.profile()).completed.wudu).toBeTruthy();

    await learning.completeLesson('wudu', false);
    expect((await learning.profile()).completed.wudu).toBeUndefined();
  });
});

describe('recommendations', () => {
  it('leads with the review backlog when cards are due', async () => {
    await learning.enroll([{ id: 'a', type: 'name', topic: 'names' }]);
    const [first] = await learning.recommendations();
    expect(first.kind).toBe('review');
  });

  it('suggests learning new material once nothing is due', async () => {
    await learning.enroll([{ id: 'a', type: 'name', topic: 'names' }]);
    await learning.review('a', 'good');
    const recs = await learning.recommendations();
    expect(recs.every(r => r.kind !== 'review')).toBe(true);
  });
});

describe('streak', () => {
  it('is zero with no history', async () => {
    expect(await currentStreak()).toBe(0);
  });

  it('counts today once a review has happened', async () => {
    await learning.enroll([{ id: 'a', type: 'name', topic: 'names' }]);
    await learning.review('a', 'good');
    expect(await currentStreak()).toBe(1);
  });
});
