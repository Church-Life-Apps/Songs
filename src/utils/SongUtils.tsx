/**
 * Helpers for Song Related things.
 *
 * Write the helper function here, and then use them by importing it by relative path like:
 *
 * import { makeThreeDigits } from '../utils/SongUtils'
 */

export const SHL_RESOURCE_JSON_KEY = "Songs and Hymns of Life";

export const shlJsonUrl =
  "https://raw.githubusercontent.com/Church-Life-Apps/Resources/master/resources/metadata/shl.json";

export const SHL_BOOK_ID = "shl";

const emptyMap = new Map();

/**
 * Prepends 0s onto a 1 or 2 digit number to make it look like a 3 digit number.
 */
export function makeThreeDigits(num: number): string {
  if (num < 10) {
    return `00${num}`;
  } else if (num < 100) {
    return `0${num}`;
  } else {
    return `${num}`;
  }
}

export enum SongViewMode {
  Music,
  Lyrics,
}

/**
 * Fields from the shl.json resource file.
 * Add more fields here when they are required in the app.
 */
export interface Song {
  title: string;
  author: string;
  songNumber: number;
  lyrics: Map<string, string[]>;
}

// Placeholder blank song.
export const PLACEHOLDER_SONG: Song = { title: "", author: "", songNumber: 0, lyrics: emptyMap };
