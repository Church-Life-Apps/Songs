/**
 * Helper functions for Security stuff.
 */

let CryptoJS = require("crypto-js");

/**
 * Uses AES to encrypt some text with the given private key.
 */
export function encrypt(normalText: String, privateKey: String) {
    return CryptoJS.AES.encrypt(normalText, privateKey);
}

/**
 * Uses AES to decrypt some text with the given private key.
 */
export function decrypt(encryptedtext: String, privateKey: String) {
   return CryptoJS.AES.decrypt(encryptedtext, privateKey).toString(CryptoJS.enc.Utf8);
}
