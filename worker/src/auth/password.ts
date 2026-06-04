/**
 * Password hashing with PBKDF2-HMAC-SHA-256 via the Web Crypto API.
 *
 * Runs natively in Cloudflare Workers (and Node 18+), so the exact same code
 * path is used by the seed script — no bcrypt, no native modules, no drift
 * between seeded and runtime-created hashes.
 */
import { base64ToBytes, bytesToBase64, constantTimeEqual } from '../lib/encoding';

const ITERATIONS = 100_000; // >= 100k per spec
const KEY_LEN_BITS = 256;
const SALT_LEN = 16;

async function deriveBits(password: string, salt: Uint8Array): Promise<Uint8Array> {
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    'PBKDF2',
    false,
    ['deriveBits'],
  );
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt, iterations: ITERATIONS, hash: 'SHA-256' },
    keyMaterial,
    KEY_LEN_BITS,
  );
  return new Uint8Array(bits);
}

/** Hash a plaintext password. Returns base64 salt + base64 derived key. */
export async function hashPassword(password: string): Promise<{ hash: string; salt: string }> {
  const salt = crypto.getRandomValues(new Uint8Array(SALT_LEN));
  const derived = await deriveBits(password, salt);
  return { hash: bytesToBase64(derived), salt: bytesToBase64(salt) };
}

/** Verify a plaintext password against a stored salt + hash, in constant time. */
export async function verifyPassword(password: string, saltB64: string, hashB64: string): Promise<boolean> {
  let expected: Uint8Array;
  let salt: Uint8Array;
  try {
    salt = base64ToBytes(saltB64);
    expected = base64ToBytes(hashB64);
  } catch {
    return false;
  }
  const derived = await deriveBits(password, salt);
  return constantTimeEqual(derived, expected);
}
