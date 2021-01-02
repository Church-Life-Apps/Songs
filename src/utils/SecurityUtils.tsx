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
 */
export function decrypt(encryptedtext: string, privateKey: string): string {
  return CryptoJS.AES.decrypt(encryptedtext, privateKey).toString(CryptoJS.enc.Utf8);
}
