/**
 * fix-theme.js
 *
 * Converts every screen from:
 *   import { COLORS, globalStyles } from '../theme';
 *   const styles = StyleSheet.create({ ... COLORS.xxx ... });
 *
 * To the live-theme pattern:
 *   import { useColors, useGlobalStyles, useThemedStyles } from '../theme';
 *   // inside component:
 *   const COLORS = useColors();
 *   const globalStyles = useGlobalStyles();
 *   const styles = useThemedStyles(makeStyles);
 *   // at module bottom:
 *   const makeStyles = (COLORS) => StyleSheet.create({ ... });
 */

const fs   = require('fs');
const path = require('path');

const SCREENS_DIR = path.join(__dirname, '..', 'src', 'screens');

const files = fs.readdirSync(SCREENS_DIR).filter(f => f.endsWith('.jsx'));

let converted = 0;
let skipped   = 0;

for (const file of files) {
  const filePath = path.join(SCREENS_DIR, file);
  let src = fs.readFileSync(filePath, 'utf8');

  // ── Skip if already uses hook-based theme ──────────────────────────────
  if (src.includes('useColors()') || src.includes('useThemedStyles(')) {
    console.log(`  SKIP  ${file}  (already uses hooks)`);
    skipped++;
    continue;
  }

  // ── Skip if it doesn't import COLORS from ../theme ─────────────────────
  if (!src.includes("from '../theme'") && !src.includes('from "../theme"')) {
    console.log(`  SKIP  ${file}  (no theme import)`);
    skipped++;
    continue;
  }

  const original = src;

  // ── 1. Update the import line ───────────────────────────────────────────
  // Replace   import { COLORS, globalStyles } from '../theme';
  // With      import { useColors, useGlobalStyles, useThemedStyles } from '../theme';
  src = src.replace(
    /import\s*\{[^}]*\bCOLORS\b[^}]*\}\s*from\s*['"]\.\.\/theme['"]\s*;?/,
    (match) => {
      // Keep any non-COLORS/globalStyles imports from the same barrel
      const extras = (match.match(/\{([^}]*)\}/) || ['', ''])[1]
        .split(',')
        .map(s => s.trim())
        .filter(s => s && s !== 'COLORS' && s !== 'globalStyles');

      const keeps = extras.length ? `, ${extras.join(', ')}` : '';
      return `import { useColors, useGlobalStyles, useThemedStyles${keeps} } from '../theme';`;
    }
  );

  // ── 2. Find the default-export function body and inject hooks ───────────
  // Matches:  export default function Xxx({ ... }) {
  //      or:  export default function Xxx(props) {
  const funcMatch = src.match(
    /export\s+default\s+function\s+\w+\s*\([^)]*\)\s*\{/
  );

  if (!funcMatch) {
    // Arrow-function exported default — less common, skip for safety
    console.log(`  SKIP  ${file}  (no default-export function found)`);
    fs.writeFileSync(filePath, original); // restore
    skipped++;
    continue;
  }

  const insertAfter = funcMatch.index + funcMatch[0].length;

  // Build the hook block — only include globalStyles hook if used
  const needsGlobal = src.includes('globalStyles');
  const hookBlock = [
    '\n  // ── Live theme hooks (replaces frozen module-level COLORS) ────────────',
    '  const COLORS = useColors();',
    needsGlobal ? '  const globalStyles = useGlobalStyles();' : null,
    '  const styles = useThemedStyles(makeStyles);',
  ].filter(Boolean).join('\n') + '\n';

  src = src.slice(0, insertAfter) + hookBlock + src.slice(insertAfter);

  // ── 3. Rename module-level StyleSheet.create to a makeStyles factory ────
  // Replace:  const styles = StyleSheet.create({
  // With:     const makeStyles = (COLORS) => StyleSheet.create({
  // And close with });  → });  (no change needed at the closing)
  //
  // We want the LAST occurrence (module-bottom pattern). Replace ALL
  // module-level `const styles = StyleSheet.create(` outside a function.
  // Simple heuristic: replace any occurrence that is at the start of a line
  // (indentation === 0 or minimal).
  src = src.replace(
    /^(const\s+styles\s*=\s*StyleSheet\.create\()/gm,
    'const makeStyles = (COLORS) => StyleSheet.create('
  );

  // ── 4. Safety: if makeStyles already existed or something went wrong ─────
  if (!src.includes('makeStyles')) {
    console.log(`  WARN  ${file}  (makeStyles not injected — skipping write)`);
    skipped++;
    continue;
  }

  // ── 5. Write back ────────────────────────────────────────────────────────
  fs.writeFileSync(filePath, src, 'utf8');
  console.log(`  OK    ${file}`);
  converted++;
}

console.log(`\nDone. Converted: ${converted}  Skipped: ${skipped}`);
