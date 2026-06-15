/**
 * Helper functions for Security stuff.
 */

import CryptoJS from "crypto-js";

/**
 * Uses AES to encrypt some text with the given private key.
 */
export function encrypt(normalText: string, privateKey: string): string {
  return CryptoJS.AES.encrypt(normalText, privateKey).toString();
}

/**
 * Uses AES to decrypt some text with the given private key.
 *
 * Returns "" when decryption yields invalid UTF-8 (e.g. a wrong key produces
 * random bytes) instead of throwing "Malformed UTF-8 data". This makes the
 * function degrade gracefully for callers (e.g. FeedbackForm) and removes an
 * intermittent ~6% failure in the wrong-key test case.
 */
export function decrypt(encryptedtext: string, privateKey: string): string {
  try {
    return CryptoJS.AES.decrypt(encryptedtext, privateKey).toString(CryptoJS.enc.Utf8);
  } catch {
    return "";
  }
}
