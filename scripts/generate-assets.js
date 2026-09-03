// Regenerates every brand asset in assets/ from code — no native image deps.
// Usage: node scripts/generate-assets.js [outDir]  (default: ./assets)
const zlib = require('zlib');
const fs = require('fs');
const path = require('path');

const OUT = process.argv[2] || path.join(__dirname, "..", "assets");

function crc32(buf) {
  let c, crc = 0xffffffff;
  for (let n = 0; n < buf.length; n++) {
    c = (crc ^ buf[n]) & 0xff;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    crc = c ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
}

function writePng(file, w, h, rgba) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0);
  ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8;   // bit depth
  ihdr[9] = 6;   // RGBA
  const raw = Buffer.alloc((w * 4 + 1) * h);
  for (let y = 0; y < h; y++) {
    raw[y * (w * 4 + 1)] = 0; // filter: none
    rgba.copy(raw, y * (w * 4 + 1) + 1, y * w * 4, (y + 1) * w * 4);
  }
  const png = Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', zlib.deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
  fs.writeFileSync(file, png);
  return png.length;
}

// ---- brand palette (matches src/config/themes/default.js) ----
const INK = [8, 12, 22];        // deep night
const INK2 = [17, 26, 46];      // navy
const GOLD = [212, 175, 55];
const GOLD_HI = [245, 218, 130];
const EMERALD = [16, 185, 129];

const lerp = (a, b, t) => a.map((v, i) => Math.round(v + (b[i] - v) * t));

// Signed-distance helpers
function sdStar(px, py, points, rOuter, rInner, rot) {
  const ang = Math.atan2(py, px) + rot;
  const seg = (Math.PI * 2) / points;
  const a = ((ang % seg) + seg) % seg;
  const t = Math.abs(a - seg / 2) / (seg / 2); // 0 at petal centre, 1 at valley
  const r = rInner + (rOuter - rInner) * (1 - t);
  return Math.hypot(px, py) - r;
}

// Axis-aligned square, signed distance.
function sdBox(px, py, a) {
  const qx = Math.abs(px) - a, qy = Math.abs(py) - a;
  const out = Math.hypot(Math.max(qx, 0), Math.max(qy, 0));
  return out + Math.min(Math.max(qx, qy), 0);
}

// Rub el Hizb: two squares, one rotated 45 degrees, unioned.
function sdRubElHizb(px, py, a) {
  const c = Math.SQRT1_2;
  const rx = (px - py) * c, ry = (px + py) * c;
  return Math.min(sdBox(px, py, a), sdBox(rx, ry, a));
}

// Anti-aliased fill: returns coverage 0..1 for a distance field
const cov = (d, aa) => Math.min(1, Math.max(0, 0.5 - d / aa));

function blend(dst, i, color, alpha) {
  if (alpha <= 0) return;
  const a = Math.min(1, alpha);
  dst[i] = Math.round(dst[i] * (1 - a) + color[0] * a);
  dst[i + 1] = Math.round(dst[i + 1] * (1 - a) + color[1] * a);
  dst[i + 2] = Math.round(dst[i + 2] * (1 - a) + color[2] * a);
  dst[i + 3] = 255;
}

/**
 * Draws the Qitab-e-Noor mark: an eight-point Rub el Hizb star holding a
 * crescent, on a radial night-sky gradient.
 * @param scale 0..1 size of the mark relative to the shorter side
 */
function render(w, h, { scale = 0.62, bg = true, transparentBg = false } = {}) {
  const buf = Buffer.alloc(w * h * 4);
  const cx = w / 2, cy = h / 2;
  const side = Math.min(w, h);
  const R = (side * scale) / 2;
  const aa = Math.max(1.2, side / 512);

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      const dx = x - cx, dy = y - cy;

      if (transparentBg) {
        buf[i] = buf[i + 1] = buf[i + 2] = buf[i + 3] = 0;
      } else if (bg) {
        // radial gradient, brighter toward the centre
        const t = Math.min(1, Math.hypot(dx, dy) / (Math.hypot(w, h) / 2));
        const c = lerp(INK2, INK, t * t);
        buf[i] = c[0]; buf[i + 1] = c[1]; buf[i + 2] = c[2]; buf[i + 3] = 255;
      }

      // outer hairline ring
      const ring = Math.abs(Math.hypot(dx, dy) - R * 1.0) - R * 0.016;
      blend(buf, i, GOLD, cov(ring, aa) * 0.7);

      // Rub el Hizb, drawn as a stroke so the geometry stays legible
      const star = sdRubElHizb(dx, dy, R * 0.60);
      const starC = lerp(GOLD_HI, GOLD, Math.min(1, Math.hypot(dx, dy) / R));
      blend(buf, i, starC, cov(Math.abs(star) - R * 0.030, aa));

      // crescent, opening to the right
      const cr = Math.hypot(dx, dy) - R * 0.40;
      const crCut = Math.hypot(dx - R * 0.20, dy) - R * 0.345;
      blend(buf, i, GOLD_HI, cov(Math.max(cr, -crCut), aa));

      // five-point star cradled in the crescent's opening
      const s2 = sdStar(dx - R * 0.26, dy, 5, R * 0.15, R * 0.062, -Math.PI / 2);
      blend(buf, i, EMERALD, cov(s2, aa));

    }
  }
  return buf;
}

const targets = [
  // Store icon — opaque, mark sized for the rounded-corner mask.
  { file: 'icon.png', w: 1024, h: 1024, opts: { scale: 0.68 } },
  // Adaptive icon — Android masks to the inner 66%, so keep the mark small.
  { file: 'adaptive-icon.png', w: 1024, h: 1024, opts: { scale: 0.44 } },
  { file: 'favicon.png', w: 96, h: 96, opts: { scale: 0.78 } },
  // Notification icon — Android tints this, so silhouette only.
  { file: 'notification-icon.png', w: 192, h: 192, opts: { scale: 0.8, transparentBg: true } },
];

for (const t of targets) {
  const bytes = writePng(path.join(OUT, t.file), t.w, t.h, render(t.w, t.h, t.opts));
  console.log(`${t.file}  ${t.w}x${t.h}  ${(bytes / 1024).toFixed(1)} KB`);
}

// Splash — portrait canvas, mark centred small (resizeMode: contain).
{
  const w = 1284, h = 2778;
  const buf = Buffer.alloc(w * h * 4);
  const cx = w / 2, cy = h / 2;
  // vertical night gradient
  for (let y = 0; y < h; y++) {
    const c = lerp(INK2, INK, Math.abs(y - cy) / cy);
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      buf[i] = c[0]; buf[i + 1] = c[1]; buf[i + 2] = c[2]; buf[i + 3] = 255;
    }
  }
  // composite the mark at 38% of the width
  const m = Math.round(w * 0.38);
  const mark = render(m, m, { scale: 0.92, transparentBg: true });
  const ox = Math.round(cx - m / 2), oy = Math.round(cy - m / 2);
  for (let y = 0; y < m; y++) {
    for (let x = 0; x < m; x++) {
      const si = (y * m + x) * 4;
      const a = mark[si + 3] / 255;
      if (a === 0) continue;
      const di = ((y + oy) * w + (x + ox)) * 4;
      blend(buf, di, [mark[si], mark[si + 1], mark[si + 2]], a);
    }
  }
  const bytes = writePng(path.join(OUT, 'splash.png'), w, h, buf);
  console.log(`splash.png  ${w}x${h}  ${(bytes / 1024).toFixed(1)} KB`);
}
