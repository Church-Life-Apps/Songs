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

/**
 * Returns true only when `url` is a non-empty string safe to pass to `fetch()`.
 *
 * Guards against the case where an optional URL prop is `undefined`/`null`/empty.
 * Passing `undefined` to `fetch()` coerces it to the string "undefined", which the
 * browser resolves against the origin and requests as `/undefined` (a spurious 404).
 *
 * NOTE: This is a nullish/empty guard only. It intentionally does NOT reject the
 * literal string "undefined" or app-logic-corrupted URLs like "undefined080.png"
 * (see {@link buildSheetMusicUrl} and {@link isImageResponse}, which guard those).
 */
export function isFetchableUrl(url: string | undefined | null): url is string {
  return typeof url === "string" && url.trim().length > 0;
}

/**
 * Builds the absolute sheet-music PNG URL for a song, or returns "" when the
 * songbook's `musicUrl` base is not yet available.
 *
 * Why this exists (guards #211):
 * The music image URL was previously built inline as
 *   `songbook?.musicUrl + makeThreeDigits(n) + suffix + ".png"`.
 * When the songbook has not finished loading (async fetch), `songbook?.musicUrl`
 * is `undefined`, and string concatenation produces the string
 *   `"undefined" + "080" + ".png"` === `"undefined080.png"`.
 * That is a NON-EMPTY, fetchable-looking RELATIVE url, so `isFetchableUrl` lets it
 * through, the browser resolves it against the origin, and it 404s to an HTML
 * error page. The download button then serves that HTML as `<book>_<n>.html`.
 *
 * By returning "" whenever `musicUrl` is falsy, no `undefined...png` URL is ever
 * produced, and downstream `isFetchableUrl` correctly skips the prefetch.
 */
export function buildSheetMusicUrl(
  musicUrl: string | undefined | null,
  songNumber: number,
  suffix = ""
): string {
  if (!musicUrl || musicUrl.trim().length === 0) {
    return "";
  }
  return `${musicUrl}${makeThreeDigits(songNumber)}${suffix}.png`;
}

/**
 * Returns true only when an HTTP response looks like a real sheet-music image
 * (2xx status and an image/* content-type), rather than an HTML error page.
 *
 * Guards #211: `fetch(...).then(r => r.blob())` happily turns a 404 HTML error
 * page into a blob. Wiring that blob into the download button (whose `download`
 * attribute has no extension) makes the browser save `<book>_<n>.html`.
 * Validating the response before building the blob prevents the HTML download.
 */
export function isImageResponse(response: {
  ok: boolean;
  headers: { get(name: string): string | null };
}): boolean {
  if (!response.ok) {
    return false;
  }
  const contentType = (response.headers.get("content-type") || "").toLowerCase();
  return contentType.startsWith("image/");
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
  {
    name: "Songs For Our Generation",
    bookId: "sfog",
    lyricsUrl: "https://raw.githubusercontent.com/Church-Life-Apps/Resources/master/resources/metadata/sfog.json",
    musicUrl: "https://raw.githubusercontent.com/Church-Life-Apps/Resources/master/resources/images/sfog/SFOG_",
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
  return fetch(songbooksListUrl)
    .then(async (response) => {
      const body = await response.json();
      const stableBooks: Songbook[] = body["songbooks"];
      const testingBooks: Songbook[] = body["testing"];
      const songbooks = includeTestingSongbooks ? stableBooks.concat(testingBooks) : stableBooks;
      cachedSongbooks = songbooks;
      songbooksFetched = true;
      return songbooks;
    })
    .catch((e) => {
      console.error(`Failed to get songbooks list due to ${e}`);
      return defaultSongbooks;
    });
}

/**
 * Get Songbook By Id.
 */
export async function getSongbookById(bookId: string): Promise<Songbook | undefined> {
  const songbooks = await getSongbooks();
  return songbooks.find((book) => book.bookId === bookId);
}
