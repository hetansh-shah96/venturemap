import { deflateSync } from 'zlib';
import { writeFileSync, mkdirSync } from 'fs';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const publicDir = resolve(__dirname, '../public');

function uint32BE(n) {
  const b = Buffer.alloc(4);
  b.writeUInt32BE(n, 0);
  return b;
}

function crc32(buf) {
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let j = 0; j < 8; j++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[i] = c;
  }
  let crc = 0xffffffff;
  for (const byte of buf) crc = table[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const t = Buffer.from(type, 'ascii');
  const crcBuf = Buffer.concat([t, data]);
  return Buffer.concat([uint32BE(data.length), t, data, uint32BE(crc32(crcBuf))]);
}

/**
 * Travel icon: black background with white line-art.
 *
 * Layers (back to front):
 *   1. Black fill
 *   2. Subtle cross-grid (map reference)
 *   3. Two overlapping globe circle outlines
 *   4. Diagonal flight route line (lower-left → upper-right)
 *   5. Cut-out chevron arrows stamped along the route
 *   6. Hollow ring at departure (lower-left)
 *   7. Filled circle at destination (upper-right)
 */
function makeIcon(size) {
  const BG    = [26,  26,  26,  255];  // #1A1A1A
  const WHITE = [244, 244, 241, 255];  // #F4F4F1
  const GRID  = [48,  48,  46,  255];  // barely-lighter than BG for subtle grid

  // --- pixel buffer ---
  const buf = new Uint8Array(size * size * 4);
  for (let i = 0; i < buf.length; i += 4) {
    buf[i] = BG[0]; buf[i+1] = BG[1]; buf[i+2] = BG[2]; buf[i+3] = BG[3];
  }

  function setPixel(x, y, col) {
    const xi = Math.round(x), yi = Math.round(y);
    if (xi < 0 || xi >= size || yi < 0 || yi >= size) return;
    const i = (yi * size + xi) * 4;
    buf[i] = col[0]; buf[i+1] = col[1]; buf[i+2] = col[2]; buf[i+3] = col[3];
  }

  // --- grid ---
  const gap = Math.round(size / 7);
  for (let g = gap; g < size - gap / 2; g += gap)
    for (let i = 0; i < size; i++) {
      setPixel(i, g, GRID);
      setPixel(g, i, GRID);
    }

  // --- circle outline ---
  function circleOutline(cx, cy, r, thick, col) {
    const r0 = r - thick / 2, r1 = r + thick / 2;
    for (let y = Math.max(0, Math.floor(cy - r1 - 1)); y <= Math.min(size-1, Math.ceil(cy + r1 + 1)); y++)
      for (let x = Math.max(0, Math.floor(cx - r1 - 1)); x <= Math.min(size-1, Math.ceil(cx + r1 + 1)); x++) {
        const d = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2);
        if (d >= r0 && d <= r1) setPixel(x, y, col);
      }
  }

  // --- filled circle ---
  function filledCircle(cx, cy, r, col) {
    for (let y = Math.max(0, Math.floor(cy - r)); y <= Math.min(size-1, Math.ceil(cy + r)); y++)
      for (let x = Math.max(0, Math.floor(cx - r)); x <= Math.min(size-1, Math.ceil(cx + r)); x++)
        if ((x - cx) ** 2 + (y - cy) ** 2 <= r * r) setPixel(x, y, col);
  }

  // --- thick line (distance-to-segment) ---
  function thickLine(x0, y0, x1, y1, thick, col) {
    const dx = x1 - x0, dy = y1 - y0, len2 = dx * dx + dy * dy;
    const h = thick / 2;
    for (let y = Math.max(0, Math.floor(Math.min(y0, y1) - h)); y <= Math.min(size-1, Math.ceil(Math.max(y0, y1) + h)); y++)
      for (let x = Math.max(0, Math.floor(Math.min(x0, x1) - h)); x <= Math.min(size-1, Math.ceil(Math.max(x0, x1) + h)); x++) {
        const t = len2 === 0 ? 0 : Math.max(0, Math.min(1, ((x - x0) * dx + (y - y0) * dy) / len2));
        const px = x0 + t * dx, py = y0 + t * dy;
        if ((x - px) ** 2 + (y - py) ** 2 <= h * h) setPixel(x, y, col);
      }
  }

  // --- filled triangle ---
  function filledTriangle(ax, ay, bx, by, cx, cy, col) {
    const minX = Math.max(0, Math.floor(Math.min(ax, bx, cx)));
    const maxX = Math.min(size-1, Math.ceil(Math.max(ax, bx, cx)));
    const minY = Math.max(0, Math.floor(Math.min(ay, by, cy)));
    const maxY = Math.min(size-1, Math.ceil(Math.max(ay, by, cy)));
    for (let y = minY; y <= maxY; y++)
      for (let x = minX; x <= maxX; x++) {
        const d1 = (x - ax) * (by - ay) - (bx - ax) * (y - ay);
        const d2 = (x - bx) * (cy - by) - (cx - bx) * (y - by);
        const d3 = (x - cx) * (ay - cy) - (ax - cx) * (y - cy);
        if (!((d1 < 0 || d2 < 0 || d3 < 0) && (d1 > 0 || d2 > 0 || d3 > 0)))
          setPixel(x, y, col);
      }
  }

  const S = size;

  // === 1. Globe arc — large circle, off-centre right ===
  const g1r  = Math.round(S * 0.50);
  const g1cx = Math.round(S * 0.62);
  const g1cy = Math.round(S * 0.40);
  const lw   = Math.max(2, Math.round(S * 0.010));
  circleOutline(g1cx, g1cy, g1r, lw, WHITE);

  // === 2. Second globe arc — smaller, off-centre left ===
  const g2r  = Math.round(S * 0.30);
  const g2cx = Math.round(S * 0.24);
  const g2cy = Math.round(S * 0.58);
  circleOutline(g2cx, g2cy, g2r, lw, WHITE);

  // === 3. Flight route line (lower-left → upper-right) ===
  const sx = Math.round(S * 0.07);
  const sy = Math.round(S * 0.87);
  const ex = Math.round(S * 0.87);
  const ey = Math.round(S * 0.12);
  const rT  = Math.max(4, Math.round(S * 0.045));  // route thickness (bold band)
  thickLine(sx, sy, ex, ey, rT, WHITE);

  // === 4. Chevron cut-outs along route ===
  const rdx = ex - sx, rdy = ey - sy;
  const rlen = Math.sqrt(rdx * rdx + rdy * rdy);
  const ndx = rdx / rlen, ndy = rdy / rlen;   // unit: along route
  const pdx = -ndy,       pdy = ndx;           // unit: perpendicular to route
  const aL = rT * 1.1;   // chevron front-to-back length
  const aW = rT * 0.62;  // chevron half-width

  for (const t of [0.20, 0.33, 0.46, 0.59, 0.72]) {
    const mx = sx + rdx * t, my = sy + rdy * t;
    const tipX = mx + ndx * aL,        tipY = my + ndy * aL;
    const b1x  = mx - ndx * aL * 0.5 + pdx * aW,  b1y = my - ndy * aL * 0.5 + pdy * aW;
    const b2x  = mx - ndx * aL * 0.5 - pdx * aW,  b2y = my - ndy * aL * 0.5 - pdy * aW;
    filledTriangle(tipX, tipY, b1x, b1y, b2x, b2y, BG); // cut-out in black
  }

  // === 5. Departure marker — hollow ring (lower-left) ===
  const depR = Math.round(S * 0.048);
  circleOutline(sx, sy, depR, Math.max(2, Math.round(S * 0.012)), WHITE);

  // === 6. Destination — filled circle + outer ring (upper-right) ===
  const destR = Math.round(S * 0.052);
  filledCircle(ex, ey, destR, WHITE);
  circleOutline(ex, ey, Math.round(destR * 1.85), Math.max(1, Math.round(S * 0.008)), WHITE);

  // === assemble PNG scanlines ===
  const scanlines = Buffer.alloc(size * (1 + size * 4));
  for (let y = 0; y < size; y++) {
    const rowBase = y * (1 + size * 4);
    scanlines[rowBase] = 0; // filter: None
    for (let x = 0; x < size; x++) {
      const src = (y * size + x) * 4;
      const dst = rowBase + 1 + x * 4;
      scanlines[dst]     = buf[src];
      scanlines[dst + 1] = buf[src + 1];
      scanlines[dst + 2] = buf[src + 2];
      scanlines[dst + 3] = buf[src + 3];
    }
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; ihdr[9] = 6; // 8-bit RGBA

  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(scanlines)),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

mkdirSync(publicDir, { recursive: true });
writeFileSync(resolve(publicDir, 'icon-192.png'), makeIcon(192));
writeFileSync(resolve(publicDir, 'icon-512.png'), makeIcon(512));
console.log('Icons generated: public/icon-192.png  public/icon-512.png');
