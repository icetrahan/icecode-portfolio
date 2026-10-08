const SKIN_PREFIX = 'PHSKIN:';

// 32-byte AES-GCM key split into parts to avoid a single obvious string literal
const K0 = new Uint8Array([80, 82, 73, 77, 65, 76, 72, 69]);  // PRIMALHE
const K1 = new Uint8Array([65, 86, 78, 83, 75, 73, 78, 48]);  // AVNSKIN0
const K2 = new Uint8Array([57, 69, 78, 67, 82, 89, 80, 84]);  // 9ENCRYPT
const K3 = new Uint8Array([69, 68, 50, 48, 50, 54, 48, 48]);  // ED202600

async function getKey(): Promise<CryptoKey> {
  const raw = new Uint8Array(32);
  raw.set(K0, 0);
  raw.set(K1, 8);
  raw.set(K2, 16);
  raw.set(K3, 24);
  return crypto.subtle.importKey('raw', raw, { name: 'AES-GCM' }, false, ['encrypt', 'decrypt']);
}

export function isEncryptedSkin(str: string): boolean {
  return str.trim().startsWith(SKIN_PREFIX);
}

export async function encryptSkin(jsonString: string): Promise<string> {
  const key = await getKey();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encoded = new TextEncoder().encode(jsonString);
  const ciphertext = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, encoded);
  const combined = new Uint8Array(12 + ciphertext.byteLength);
  combined.set(iv, 0);
  combined.set(new Uint8Array(ciphertext), 12);
  return SKIN_PREFIX + btoa(String.fromCharCode(...combined));
}

export async function decryptSkin(encrypted: string): Promise<string> {
  const base64 = encrypted.trim().slice(SKIN_PREFIX.length);
  const combined = Uint8Array.from(atob(base64), c => c.charCodeAt(0));
  const iv = combined.slice(0, 12);
  const ciphertext = combined.slice(12);
  const key = await getKey();
  const decrypted = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, ciphertext);
  return new TextDecoder().decode(decrypted);
}
