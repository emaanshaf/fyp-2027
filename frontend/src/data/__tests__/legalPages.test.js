import fs from 'fs';
import path from 'path';
import { LEGAL_DOCUMENTS } from '../legal';

/**
 * The hosted pages are generated from src/data/legal.js. These checks fail if
 * someone edits the documents without running `npm run legal:export`, which is
 * exactly the drift that would otherwise ship a store listing whose policy
 * differs from the one inside the app.
 */

const pageFor = id =>
  fs.readFileSync(path.join(process.cwd(), 'public', id, 'index.html'), 'utf8');

describe('generated legal pages', () => {
  it('publishes a page for each document', () => {
    for (const id of Object.keys(LEGAL_DOCUMENTS)) {
      expect(fs.existsSync(path.join(process.cwd(), 'public', id, 'index.html'))).toBe(true);
    }
  });

  it('matches the current title, date and section headings', () => {
    for (const doc of Object.values(LEGAL_DOCUMENTS)) {
      const html = pageFor(doc.id);
      expect(html).toContain(`<h1>${doc.title}</h1>`);
      expect(html).toContain(`Last updated ${doc.updated}`);
      for (const section of doc.sections) {
        expect(html).toContain(`<h2>${section.title}</h2>`);
      }
    }
  });

  it('links each document to the other', () => {
    expect(pageFor('privacy')).toContain('https://qitabe-noor.app/terms/');
    expect(pageFor('terms')).toContain('https://qitabe-noor.app/privacy/');
  });

  it('is self-contained and mobile-ready', () => {
    for (const id of ['privacy', 'terms']) {
      const html = pageFor(id);
      expect(html).toContain('name="viewport"');
      expect(html).not.toMatch(/<script/i);
      expect(html).not.toMatch(/https?:\/\/fonts\./i);
    }
  });

  it('renders paragraphs rather than collapsing them into one block', () => {
    for (const id of ['privacy', 'terms']) {
      expect(pageFor(id).match(/<p>/g)?.length || 0).toBeGreaterThan(8);
    }
  });
});
