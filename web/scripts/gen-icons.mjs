/**
 * Generates the PWA icons (192, 512, maskable-512) with zero dependencies:
 * a near-black rounded tile with a centered crimson disc — echoing FIP's
 * affiliate dot. Renders RGBA pixels and encodes a real PNG via zlib.
 */
import { deflateSync } from 'node:zlib';
import { mkdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const BG = [9, 9, 11]; // zinc-950
const ROSE = [225, 29, 72]; // rose-600

const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n));
const lerp = (a, b, t) => a + (b - a) * t;

function sdRoundRect(px, py, half, r) {
  const qx = Math.abs(px) - (half - r);
  const qy = Math.abs(py) - (half - r);
  const ax = Math.max(qx, 0);
  const ay = Math.max(qy, 0);
  return Math.hypot(ax, ay) + Math.min(Math.max(qx, qy), 0) - r;
}

function buildIcon(size, maskable) {
  const data = new Uint8Array(size * size * 4);
  const c = size / 2;
  const half = size / 2;
  const cornerR = size * 0.22;
  const discR = size * (maskable ? 0.24 : 0.3);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const px = x + 0.5;
      const py = y + 0.5;
      // Rounded-tile alpha (maskable icons are full-bleed / opaque).
      const shapeA = maskable ? 1 : clamp(0.5 - sdRoundRect(px - c, py - c, half, cornerR), 0, 1);
      // Crimson disc coverage with 1px anti-aliasing.
      const discA = clamp(0.5 - (Math.hypot(px - c, py - c) - discR), 0, 1);
      const r = lerp(BG[0], ROSE[0], discA);
      const g = lerp(BG[1], ROSE[1], discA);
      const b = lerp(BG[2], ROSE[2], discA);
      const i = (y * size + x) * 4;
      data[i] = Math.round(r);
      data[i + 1] = Math.round(g);
      data[i + 2] = Math.round(b);
      data[i + 3] = Math.round(255 * shapeA);
    }
  }
  return data;
}

const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, 'ascii');
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([len, typeBuf, data, crc]);
}

function encodePNG(size, rgba) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type RGBA
  const stride = size * 4;
  const raw = Buffer.alloc(size * (stride + 1));
  for (let y = 0; y < size; y++) {
    const o = y * (stride + 1);
    raw[o] = 0; // filter: none
    Buffer.from(rgba.subarray(y * stride, y * stride + stride)).copy(raw, o + 1);
  }
  const idat = deflateSync(raw, { level: 9 });
  return Buffer.concat([sig, chunk('IHDR', ihdr), chunk('IDAT', idat), chunk('IEND', Buffer.alloc(0))]);
}

const outDir = fileURLToPath(new URL('../public/icons/', import.meta.url));
mkdirSync(outDir, { recursive: true });

const targets = [
  { name: 'icon-192.png', size: 192, maskable: false },
  { name: 'icon-512.png', size: 512, maskable: false },
  { name: 'icon-maskable-512.png', size: 512, maskable: true },
];

for (const t of targets) {
  const png = encodePNG(t.size, buildIcon(t.size, t.maskable));
  writeFileSync(new URL(`../public/icons/${t.name}`, import.meta.url), png);
  console.log(`wrote icons/${t.name} (${png.length} bytes)`);
}
