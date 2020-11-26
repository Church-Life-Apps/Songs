/**
 * Helper functions for Security stuff.
 */

import CryptoJS from "crypto-js";

/**
 * Uses AES to encrypt some text with the given private key.
 */
export function encrypt(normalText: string, privateKey: string): CryptoJS.lib.CipherParams {
  return CryptoJS.AES.encrypt(normalText, privateKey);
}

/**
 * Uses AES to decrypt some text with the given private key.
 */
export function decrypt(encryptedtext: string, privateKey: string): string {
  return CryptoJS.AES.decrypt(encryptedtext, privateKey).toString(CryptoJS.enc.Utf8);
}
