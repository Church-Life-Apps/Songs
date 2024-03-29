/**
 * Util functions for strings.
 */

/**
 * Removes special characters from the string.
 */
export function removePunctuation(s: string): string {
  return s.replace(/[!"#$%&'()*+,-./:;<=>?@[\]^_`{|}~]/g, "");
}

const stringSimilarity = require("string-similarity"); // eslint-disable-line @typescript-eslint/no-var-requires

/**
 * Returns a number between 0 and 1 based on how similar two strings are to each other (Case sensitive).
 * 0 = completely different.
 * 1 = the same string.
 */
export function getSimilarity(word: string, search: string): number {
  return stringSimilarity.compareTwoStrings(removePunctuation(word.toString().toLowerCase()), search);
}

export function tokenize(sentence: string): string[] {
  return sentence.split(" ");
}

export function normalize(sentence: string): string {
  return removePunctuation(sentence).toLowerCase().trim();
}

/**
 * Returns true if a string is a number, false otherwise.
 */
export function isNumeric(word: string): boolean {
  return !isNaN(+word);
}
