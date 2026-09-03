import {
  MODULES, TAB_MODULES, DRAWER_MODULES, ROUTE_PATHS, MODULE_ROLES, SCREEN_TITLES,
  LINK_PATTERNS, hasAccess, pathToRoute, paramsFromPath, buildLinkingConfig,
  moduleByName, normalisePath,
} from '../routes';
import { SCREENS } from '../../navigation/screenRegistry';

describe('route table integrity', () => {
  it('gives every module a unique name', () => {
    const names = MODULES.map(m => m.name);
    expect(new Set(names).size).toBe(names.length);
  });

  it('gives every module a unique path', () => {
    const paths = MODULES.map(m => m.path);
    expect(new Set(paths).size).toBe(paths.length);
  });

  it('stores paths without a leading slash', () => {
    for (const m of MODULES) expect(m.path.startsWith('/')).toBe(false);
  });

  it('has a registered screen component for every route', () => {
    // This is the check that would have caught the tab bar losing its
    // components when the route table was centralised.
    for (const m of MODULES) {
      expect(SCREENS[m.name]).toBeDefined();
    }
  });

  it('has a title for every module', () => {
    for (const m of MODULES) expect(SCREEN_TITLES[m.name]).toBeTruthy();
  });

  it('gives every drawer module an icon', () => {
    for (const m of DRAWER_MODULES) expect(m.icon).toBeTruthy();
  });

  it('gives every tab an icon, since the tab bar now renders them', () => {
    for (const m of TAB_MODULES) expect(m.icon).toBeTruthy();
  });

  it('grants every module at least one role', () => {
    for (const m of MODULES) expect(m.roles.length).toBeGreaterThan(0);
  });

  it('keeps tabs out of the drawer list', () => {
    const drawerNames = DRAWER_MODULES.map(m => m.name);
    for (const t of TAB_MODULES) expect(drawerNames).not.toContain(t.name);
  });
});

describe('hasAccess', () => {
  it('permits a plain user the ordinary modules', () => {
    expect(hasAccess('user', 'Quran')).toBe(true);
    expect(hasAccess('user', 'Learning')).toBe(true);
  });

  it('restricts content authoring to moderators and admins', () => {
    expect(hasAccess('user', 'Generator')).toBe(false);
    expect(hasAccess('moderator', 'Generator')).toBe(true);
    expect(hasAccess('admin', 'Generator')).toBe(true);
  });

  it('denies unknown routes rather than defaulting open', () => {
    expect(hasAccess('admin', 'NoSuchModule')).toBe(false);
  });

  it('treats a missing role as a plain user', () => {
    expect(hasAccess(undefined, 'Quran')).toBe(true);
    expect(hasAccess(undefined, 'Generator')).toBe(false);
  });

  it('agrees with the derived MODULE_ROLES table', () => {
    for (const m of MODULES) {
      expect(MODULE_ROLES[m.name]).toEqual(m.roles);
    }
  });
});

describe('pathToRoute', () => {
  it('maps the root and dashboard to Home', () => {
    expect(pathToRoute('/')).toBe('Home');
    expect(pathToRoute('/dashboard')).toBe('Home');
  });

  it('resolves exact module paths', () => {
    expect(pathToRoute('/quran')).toBe('Quran');
    expect(pathToRoute('/names-of-allah')).toBe('NamesOfAllah');
    expect(pathToRoute('/learning')).toBe('Learning');
  });

  it('ignores surrounding slashes and query strings', () => {
    expect(pathToRoute('quran')).toBe('Quran');
    expect(pathToRoute('/quran/')).toBe('Quran');
    expect(pathToRoute('/quran?x=1')).toBe('Quran');
  });

  it('resolves nested deep links', () => {
    expect(pathToRoute('/quran/2')).toBe('Quran');
    expect(pathToRoute('/quran/2/ayah/255')).toBe('Quran');
    expect(pathToRoute('/tafsir/2/255')).toBe('Tafsir');
    expect(pathToRoute('/hadith/bukhari/1')).toBe('Hadith');
  });

  it('prefers a literal route over a parameterised one', () => {
    // /hadith/verify must not be swallowed by /hadith/:collection.
    expect(pathToRoute('/hadith/verify')).toBe('HadithVerify');
    expect(pathToRoute('/learning/review')).toBe('ReviewSession');
  });

  it('returns null for unknown paths so the 404 can render', () => {
    expect(pathToRoute('/nope')).toBeNull();
    expect(pathToRoute('/quran/1/2/3/4')).toBeNull();
  });
});

describe('paramsFromPath', () => {
  it('extracts and casts numeric params', () => {
    expect(paramsFromPath('/quran/2/ayah/255')).toEqual({ surah: 2, ayah: 255 });
    expect(paramsFromPath('/tafsir/18/10')).toEqual({ surah: 18, ayah: 10 });
  });

  it('keeps string params as strings', () => {
    expect(paramsFromPath('/hadith/bukhari')).toEqual({ collection: 'bukhari' });
  });

  it('mixes cast and uncast params', () => {
    expect(paramsFromPath('/hadith/muslim/42')).toEqual({ collection: 'muslim', number: 42 });
  });

  it('returns nothing for a non-parameterised path', () => {
    expect(paramsFromPath('/quran')).toEqual({});
  });

  it('rejects a non-numeric value where a number is required', () => {
    expect(paramsFromPath('/quran/abc')).toEqual({});
  });
});

describe('buildLinkingConfig', () => {
  const linking = buildLinkingConfig();
  const screens = linking.config.screens.Main.screens;

  it('declares the deep-link prefixes', () => {
    expect(linking.prefixes).toContain('qitabe-noor://');
    expect(linking.prefixes).toContain('https://qitabe-noor.app');
  });

  it('nests the tab routes under MainTabs', () => {
    expect(Object.keys(screens.MainTabs.screens).sort())
      .toEqual(TAB_MODULES.map(m => m.name).sort());
  });

  it('registers every non-tab module', () => {
    for (const m of MODULES.filter(x => !x.tab)) {
      expect(screens[m.name]).toBeDefined();
    }
  });

  it('gives deep-linked screens a single optional-param path', () => {
    // React Navigation accepts one `path` per screen, so multiple URLs
    // collapse into optional `:param?` segments.
    expect(screens.Tafsir.path).toBe('tafsir/:surah?/:ayah?');
    expect(screens.Hadith.path).toBe('hadith/:collection?/:number?');
  });

  it('emits only properties React Navigation accepts', () => {
    // An unknown key (`alias`, an Expo Router concept) makes
    // NavigationContainer throw "Found invalid properties in the
    // configuration" at mount — the whole app fails to render.
    const ALLOWED = new Set([
      'initialRouteName', 'screens', 'path', 'exact', 'stringify', 'parse',
    ]);
    const walk = (node, trail) => {
      if (typeof node === 'string') return;
      for (const key of Object.keys(node)) {
        expect(ALLOWED.has(key)).toBe(true);
        if (key === 'screens') {
          for (const [child, value] of Object.entries(node.screens)) {
            walk(value, `${trail}.${child}`);
          }
        }
      }
    };
    walk(linking.config, 'config');
  });

  it('parameterises the tab screens too, not just drawer screens', () => {
    // Quran and Duas are tabs; their deep links are nested under MainTabs.
    expect(screens.MainTabs.screens.Quran.path).toBe('quran/:surah?/:ayah?');
    expect(screens.MainTabs.screens.Duas.path).toBe('duas/:id?');
  });

  it('routes anything unmatched to NotFound', () => {
    expect(screens.NotFound).toBe('*');
  });
});

describe('ROUTE_PATHS', () => {
  it('prefixes every path with a slash for URL building', () => {
    for (const [name, path] of Object.entries(ROUTE_PATHS)) {
      expect(path.startsWith('/')).toBe(true);
      expect(path).toBe(`/${moduleByName(name).path}`);
    }
  });

  it('round-trips through pathToRoute', () => {
    for (const [name, path] of Object.entries(ROUTE_PATHS)) {
      expect(pathToRoute(path)).toBe(name);
    }
  });
});

describe('normalisePath', () => {
  it('rewrites the readable ayah form into the linking pattern', () => {
    // `/ayah/` is a literal middle segment, which cannot be expressed as an
    // optional param, so it is rewritten before React Navigation parses it.
    expect(normalisePath('/quran/2/ayah/255')).toBe('/quran/2/255');
    expect(normalisePath('quran/18/ayah/10')).toBe('quran/18/10');
  });

  it('leaves every other path untouched', () => {
    for (const path of ['/quran', '/quran/2', '/tafsir/2/255', '/hadith/verify', '/settings']) {
      expect(normalisePath(path)).toBe(path);
    }
  });

  it('does not rewrite a non-numeric surah', () => {
    expect(normalisePath('/quran/abc/ayah/1')).toBe('/quran/abc/ayah/1');
  });

  it('handles empty input', () => {
    expect(normalisePath(undefined)).toBe('');
  });
});

describe('LINK_PATTERNS', () => {
  it('only names screens that exist', () => {
    for (const name of Object.keys(LINK_PATTERNS)) {
      expect(moduleByName(name)).toBeDefined();
    }
  });

  it('keeps each pattern rooted at its module path', () => {
    for (const [name, pattern] of Object.entries(LINK_PATTERNS)) {
      expect(pattern.path.startsWith(moduleByName(name).path)).toBe(true);
    }
  });
});
