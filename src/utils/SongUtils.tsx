import songs from "../resources/songs.json";

/**
 * Helpers for Song Related things.
 *
 * Write the helper function here, and then use them by importing it by relative path like:
 *
 * import { makeThreeDigits } from '../utils/SongUtils'
 */

 export const shlName = "Songs and Hymns of Life";

 export const shlJsonUrl = "https://raw.githubusercontent.com/Church-Life-Apps/Resources/master/resources/metadata/shl.json";

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

export function removePunctuation(s: string): string {
  return s.replace(/[!"#$%&'()*+,-./:;<=>?@[\]^_`{|}~]/g, "");
}

export enum SongViewMode {
  Music,
  Lyrics,
}

<<<<<<< HEAD
// hard coded until we get more song books.
export const BlackBookSongs = songs["Songs and Hymns of Life"];

=======
>>>>>>> master
// TODO: use json schema
export interface Song {
  title: string;
  author: string;
  songNumber: number;
  lyrics: any;
}