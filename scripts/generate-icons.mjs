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
 * Globe icon: black background, white filled circle with a latitude/longitude
 * grid drawn as black lines — orthographic projection so longitude arcs curve
 * naturally from pole to pole.
 *
 * Grid lines:
 *   - 7 horizontal latitude bands  (equator + 3 pairs at ±27 / ±54 / ±81 % of radius)
 *   - 1 straight central meridian
 *   - 2 curved longitude arcs at sin(±37°) ≈ ±0.60 of radius from centre
 */
function makeIcon(size) {
  const BG    = [26, 26, 26, 255];    // #1A1A1A — background & grid lines
  const WHITE = [244, 244, 241, 255]; // #F4F4F1 — globe fill

  const cx = size / 2;
  const cy = size / 2;
  const globeR = Math.round(size * 0.42);            // globe occupies ~84% of icon
  const thick  = Math.max(2, Math.round(size * 0.016)); // grid line thickness

  // Latitude line centres (as fraction of globeR, positive = south on screen)
  const latY = [0, 0.27, 0.54, 0.81, -0.27, -0.54, -0.81]
    .map(f => cy + globeR * f);

  // Curved longitude arcs: sin(λ) = ±0.60  →  λ ≈ ±37°
  // Formula: x_arc = cx + sin(λ) * sqrt(R² − dy²)  (orthographic meridian)
  const lonSins = [0.60, -0.60];

  const scanlines = Buffer.alloc(size * (1 + size * 4));

  for (let y = 0; y < size; y++) {
    const rowBase = y * (1 + size * 4);
    scanlines[rowBase] = 0; // PNG filter: None

    for (let x = 0; x < size; x++) {
      const dx = x - cx;
      const dy = y - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);

      let isGlobe = dist <= globeR;
      let isLine  = false;

      if (isGlobe) {
        // Latitude lines
        for (const ly of latY) {
          if (Math.abs(y - ly) < thick / 2) { isLine = true; break; }
        }

        if (!isLine) {
          // Central meridian (straight vertical through cx)
          if (Math.abs(dx) < thick / 2) { isLine = true; }
        }

        if (!isLine) {
          // Curved longitude arcs
          const latTerm = globeR * globeR - dy * dy;
          if (latTerm >= 0) {
            const spread = Math.sqrt(latTerm);
            for (const sinL of lonSins) {
              if (Math.abs(x - (cx + sinL * spread)) < thick / 2) {
                isLine = true;
                break;
              }
            }
          }
        }
      }

      const [r, g, b, a] = (isGlobe && !isLine) ? WHITE : BG;
      const base = rowBase + 1 + x * 4;
      scanlines[base] = r; scanlines[base + 1] = g; scanlines[base + 2] = b; scanlines[base + 3] = a;
    }
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; ihdr[9] = 6; // 8-bit RGBA

  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), // PNG signature
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(scanlines)),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

mkdirSync(publicDir, { recursive: true });
writeFileSync(resolve(publicDir, 'icon-192.png'), makeIcon(192));
writeFileSync(resolve(publicDir, 'icon-512.png'), makeIcon(512));
console.log('Icons generated: public/icon-192.png  public/icon-512.png');
