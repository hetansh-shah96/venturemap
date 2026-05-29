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

function makeIcon(size) {
  const BG  = [26,  26,  26,  255]; // #1A1A1A
  const FG  = [244, 244, 241, 255]; // #F4F4F1

  const border = Math.max(2, Math.round(size * 0.055)); // outer frame thickness
  const inner  = Math.round(size * 0.18);               // inner padding for "VM" box

  // Row of raw RGBA pixels
  const row = Buffer.alloc(size * 4);

  const scanlines = Buffer.alloc(size * (1 + size * 4));

  for (let y = 0; y < size; y++) {
    // Decide colour per pixel
    for (let x = 0; x < size; x++) {
      const onOuterBorder = x < border || x >= size - border || y < border || y >= size - border;
      // Inner VM box outline
      const bx = inner, by = Math.round(size * 0.30);
      const bw = size - inner * 2, bh = Math.round(size * 0.40);
      const boxBorder = Math.max(1, Math.round(size * 0.025));
      const onBox = x >= bx && x < bx + bw && y >= by && y < by + bh
                 && (x < bx + boxBorder || x >= bx + bw - boxBorder
                  || y < by + boxBorder || y >= by + bh - boxBorder);

      const [r, g, b, a] = (onOuterBorder || onBox) ? FG : BG;
      const i = x * 4;
      row[i] = r; row[i+1] = g; row[i+2] = b; row[i+3] = a;
    }

    const offset = y * (1 + size * 4);
    scanlines[offset] = 0; // filter: None
    row.copy(scanlines, offset + 1);
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
