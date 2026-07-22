/**
 * Cryptographic link lock and decryption helpers
 * Provides secure obfuscation of private WhatsApp group links
 */

const CRYPTO_SALT = "BuriramOrgSecuredLobbySalt2026";

export function encryptLink(link: string): string {
  if (!link) return "";
  let result = "";
  for (let i = 0; i < link.length; i++) {
    const char = link.charCodeAt(i);
    const saltChar = CRYPTO_SALT.charCodeAt(i % CRYPTO_SALT.length);
    result += String.fromCharCode(char ^ saltChar);
  }
  return btoa(result);
}

export function decryptLink(encrypted: string): string {
  if (!encrypted) return "";
  try {
    const decoded = atob(encrypted);
    let result = "";
    for (let i = 0; i < decoded.length; i++) {
      const char = decoded.charCodeAt(i);
      const saltChar = CRYPTO_SALT.charCodeAt(i % CRYPTO_SALT.length);
      result += String.fromCharCode(char ^ saltChar);
    }
    return result;
  } catch (e) {
    return "";
  }
}
