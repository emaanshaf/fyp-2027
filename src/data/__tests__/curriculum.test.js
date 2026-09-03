import { LESSONS, LEVELS, withProgress, levelProgress, nextLesson, lessonById } from '../curriculum';

describe('curriculum graph', () => {
  it('gives every lesson a unique id', () => {
    const ids = LESSONS.map(l => l.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('only references prerequisites that exist', () => {
    for (const lesson of LESSONS) {
      for (const req of lesson.requires) {
        expect(lessonById(req)).toBeDefined();
      }
    }
  });

  it('assigns every lesson to a declared level', () => {
    const levels = new Set(LEVELS.map(l => l.id));
    for (const lesson of LESSONS) expect(levels.has(lesson.level)).toBe(true);
  });

  it('has no prerequisite cycles', () => {
    // A cycle would make part of the path permanently unreachable.
    const seen = {};
    const walk = (id, stack) => {
      if (stack.includes(id)) throw new Error(`cycle through ${id}`);
      if (seen[id]) return;
      seen[id] = true;
      for (const r of lessonById(id)?.requires || []) walk(r, [...stack, id]);
    };
    expect(() => LESSONS.forEach(l => walk(l.id, []))).not.toThrow();
  });

  it('never gates a lesson behind one from a later level', () => {
    const rank = { beginner: 0, intermediate: 1, advanced: 2 };
    for (const lesson of LESSONS) {
      for (const req of lesson.requires) {
        expect(rank[lessonById(req).level]).toBeLessThanOrEqual(rank[lesson.level]);
      }
    }
  });

  it('has at least one lesson unlocked from a standing start', () => {
    expect(withProgress({}).some(l => l.unlocked)).toBe(true);
  });
});

describe('withProgress', () => {
  it('locks a lesson whose prerequisites are unmet', () => {
    const salah = withProgress({}).find(l => l.id === 'salah');
    expect(salah.unlocked).toBe(false);
    expect(salah.blockedBy.length).toBeGreaterThan(0);
  });

  it('unlocks a lesson once its prerequisites are complete', () => {
    const done = { shahadah: 'x', 'pillars-islam': 'x', wudu: 'x' };
    const salah = withProgress(done).find(l => l.id === 'salah');
    expect(salah.unlocked).toBe(true);
  });

  it('marks completed lessons as done', () => {
    expect(withProgress({ shahadah: 'x' }).find(l => l.id === 'shahadah').done).toBe(true);
  });
});

describe('levelProgress', () => {
  it('reports 0% with nothing completed', () => {
    expect(levelProgress({}).every(l => l.pct === 0)).toBe(true);
  });

  it('counts only lessons within their own level', () => {
    const [beginner] = levelProgress({ shahadah: 'x' });
    expect(beginner.done).toBe(1);
    expect(beginner.total).toBe(LESSONS.filter(l => l.level === 'beginner').length);
  });
});

describe('nextLesson', () => {
  it('starts with an unlocked beginner lesson', () => {
    const next = nextLesson({});
    expect(next).not.toBeNull();
    expect(next.level).toBe('beginner');
    expect(next.unlocked).toBe(true);
  });

  it('never returns a lesson that is already done', () => {
    const completed = { shahadah: 'x' };
    expect(nextLesson(completed).id).not.toBe('shahadah');
  });

  it('returns null once every lesson is complete', () => {
    const all = Object.fromEntries(LESSONS.map(l => [l.id, 'x']));
    expect(nextLesson(all)).toBeNull();
  });

  it('walks the whole path without ever getting stuck', () => {
    // Guards the unlock logic end-to-end: completing the suggested lesson
    // repeatedly must eventually finish every lesson.
    const completed = {};
    for (let i = 0; i <= LESSONS.length; i++) {
      const next = nextLesson(completed);
      if (!next) break;
      completed[next.id] = 'x';
    }
    expect(Object.keys(completed)).toHaveLength(LESSONS.length);
  });
});
