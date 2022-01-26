/**
 * Helpers for Song Related things.
 *
 * Write the helper function here, and then use them by importing it by relative path like:
 *
 * import { makeThreeDigits } from '../utils/SongUtils'
 */

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
  presentation: string;
}

// Placeholder blank song.
export const PLACEHOLDER_SONG: Song = { title: "", author: "", songNumber: 0, lyrics: new Map(), presentation: "" };

/* ---------- Songbook Stuff -------------- */
export interface Songbook {
  name: string;
  bookId: string;
  lyricsUrl: string;
  musicUrl: string;
}

/* SongBooks List Url */
export const songbooksListUrl =
  "https://raw.githubusercontent.com/Church-Life-Apps/Resources/master/resources/songbooks.json";

/**
 * Default Songbooks to show until we pull from the above link to dynamically get all songbooks.
 * Add songbooks to here when they are stable and include them in the subsequent release.
 */
export const defaultSongbooks = [
  {
    name: "Songs and Hymns of Life",
    bookId: "shl",
    lyricsUrl: "https://raw.githubusercontent.com/Church-Life-Apps/Resources/master/resources/metadata/shl.json",
    musicUrl: "https://raw.githubusercontent.com/Church-Life-Apps/Resources/master/resources/images/shl/SHL_",
  },
];

let cachedSongbooks = defaultSongbooks;
let songbooksFetched = false;

/** For Developers only - flip to `true` to include beta books. Revert back to `false` before committing. */
const includeTestingSongbooks = false;

/**
 * Gets list of supported songbooks from the above link.
 * Fetches from the list of songbooks or returns cached list if available.
 */
export async function getSongbooks(): Promise<Songbook[]> {
  if (songbooksFetched) {
    return cachedSongbooks;
  }
  const response = await fetch(songbooksListUrl);
  if (response) {
    const body = await response.json();
    const stableBooks: Songbook[] = body["songbooks"];
    const testingBooks: Songbook[] = body["testing"];
    const songbooks = includeTestingSongbooks ? stableBooks.concat(testingBooks) : stableBooks;
    cachedSongbooks = songbooks;
    songbooksFetched = true;
    return songbooks;
  } else {
    return defaultSongbooks;
  }
}

/**
 * Get Songbook By Id.
 */
export async function getSongbookById(bookId: string): Promise<Songbook | undefined> {
  const songbooks = await getSongbooks();
  return songbooks.find((book) => book.bookId === bookId);
}
