import { SQLiteObject } from "@ionic-native/sqlite";
import { DbSong } from "../models/DbSong";
import { isCordova } from "../utils/PlatformUtils";
import { shlJsonUrl, SHL_BOOK_ID, SHL_RESOURCE_JSON_KEY, Song } from "../utils/SongUtils";
import { getItem, storeItem } from "../utils/StorageUtils";
import {
  AUTHOR,
  BOOK_ID,
  DbManager,
  FAVORITED,
  LAST_USED,
  LYRICS,
  NUM_HITS,
  SONGS_TABLE,
  SONG_NUMBER,
  TITLE,
} from "./DbManager";

/**
 * Retrieves a single song from the DB for the requested song number and updates the num_hits of that song.
 */
export function getSong(songNumber: number, callback: (song: DbSong | null) => void): void {
  const query = `SELECT * FROM ${SONGS_TABLE} WHERE ${SONG_NUMBER}=${songNumber} AND ${BOOK_ID}='${SHL_BOOK_ID}'`;
  runQuerySingle(query, `Getting song ${songNumber}`, callback);
}

/**
 * Updates the favorited field for the provided song number.
 */
export function updateSongFavorited(songNumber: number, favorited: boolean): void {
  const query = `UPDATE ${SONGS_TABLE} SET ${FAVORITED}=${favorited} WHERE ${SONG_NUMBER}=${songNumber} AND ${BOOK_ID}='${SHL_BOOK_ID}'`;

  runQuery(query, `Set ${songNumber} favorited to ${favorited}.`);
}

/**
 * Gets all songs from the database sorted by when they were last used.
 */
export function getSongsSortedByLastUsed(callback: (songs: DbSong[]) => void): void {
  const query = `SELECT * FROM ${SONGS_TABLE} WHERE ${LAST_USED} > 0 ORDER BY ${LAST_USED} DESC`;

  runQueryWithCallback(query, `Select songs ordered by last_used.`, callback);
}

/**
 * Gets all favorited songs from the database.
 */
export function getFavoriteSongs(callback: (songs: DbSong[]) => void): void {
  const query = `SELECT * FROM ${SONGS_TABLE} WHERE ${FAVORITED}=true ORDER BY ${NUM_HITS} DESC`;

  runQueryWithCallback(query, `Select Favorited Songs`, callback);
}

/**
 * Lists all songs in the DB that match the text.
 */
export function listSongsBySearchText(searchText: string, callback: (songs: DbSong[]) => void): void {
  let query: string;
  if (searchText === "") {
    query = `SELECT * FROM ${SONGS_TABLE}`;
  } else if (!isNaN(+searchText)) {
    query = `SELECT * FROM ${SONGS_TABLE} WHERE ${SONG_NUMBER} MATCH '${searchText}*'`;
  } else {
    // TODO (Brandon): Figure out how to return rows ordered by hit accuracy.
    query = `SELECT * FROM ${SONGS_TABLE} WHERE ${SONGS_TABLE} MATCH '${formatStringForSql(searchText)}'`;
  }
  runQueryWithCallback(query, `List songs by search text: "${searchText}"`, callback);
}

/**
 * Increments the num_hits by 1 and updates last_used time to now for the song number provided.
 */
export function updateSongHits(songNumber: number): void {
  const query =
    `UPDATE ${SONGS_TABLE} SET ${NUM_HITS}=${NUM_HITS} + 1, ${LAST_USED}=${Date.now()} ` +
    `WHERE ${SONG_NUMBER}=${songNumber} AND ${BOOK_ID}='${SHL_BOOK_ID}'`;
  runQuery(query, `Update hits for song ${songNumber}.`);
}

/**
 * Fetches the song list from online, trigger populating the database with the songs,
 * then returns the fetched songs immediately.
 */
export async function fetchSongsAndPopulateSongsTable(): Promise<Song[]> {
  return getItem(SHL_BOOK_ID)
    .then(async (item) => {
      if (!item) {
        const response = await fetch(shlJsonUrl);
        const body = await response.json();
        storeItem(SHL_BOOK_ID, JSON.stringify(body));
        populateDatabase(body[SHL_RESOURCE_JSON_KEY], SHL_BOOK_ID);
        return body[SHL_RESOURCE_JSON_KEY];
      } else {
        console.log("Returning stored songs Json.");
        return JSON.parse(item)[SHL_RESOURCE_JSON_KEY];
      }
    })
    .catch((r) => {
      console.error(r);
      return [];
    });
}

/**
 * Cancels all pending transactions.
 * TODO (Brandon): Unhack this and fix the search bar lag problem.
 */
export function cancelAllTransactions(): void {
  const dbManager = DbManager.getInstance();
  if (isCordova()) {
    // Mobile
    const songsTable = dbManager.getSongsTable as SQLiteObject;
    console.log("Aborting pending transactions.");
    songsTable.abortallPendingTransactions();
  }
}

/**
 * Given a list of Songs, populate the database with that song list and book id.
 * For both mobile/browser, Keep all queries under 1 transaction. Multiple transactions are more expensive.
 */
function populateDatabase(songs: Song[], bookId: string): void {
  const songsTable = DbManager.getInstance().getSongsTable;
  if (songsTable === undefined) {
    console.log(`Cannot populate DB it is undefined.`);
    return;
  }
  try {
    const startTime = Date.now();
    if (!isCordova()) {
      // Not Mobile.
      const sql = songsTable as Database;
      sql.transaction(
        (transaction) => {
          for (let i = 0; i < songs.length; ++i) {
            const song = songs[i];
            const query = getInsertSongQuery(song, bookId);
            transaction.executeSql(query);
          }
        },
        (error) => {
          console.log(`Error Populating Database: ${error.message}.`);
        },
        () => {
          console.log(`Successfully populated DB in ${Date.now() - startTime} millis.`);
        }
      );
    } else {
      // Mobile.
      const sql = songsTable as SQLiteObject;
      const queries: string[] = [];
      for (let i = 0; i < songs.length; ++i) {
        const song = songs[i];
        const query = getInsertSongQuery(song, bookId);
        queries.push(query);
      }
      sql.sqlBatch(queries).then(() => {
        console.log(`Successfully Populated DB in ${Date.now() - startTime} millis.`);
      });
    }
  } catch (e) {
    console.log(`SQL query error: Could not Populate Database, ${e}, ${e.message}.`);
  }
}

/**
 * Gets the query to insert a song based on the song object and bookId.
 */
function getInsertSongQuery(song: Song, bookId: string): string {
  return `INSERT INTO ${SONGS_TABLE} values(${song.songNumber}, '${formatStringForSql(
    bookId
  )}', 0, 0, false, '${formatStringForSql(song.author)}', '${formatStringForSql(song.title)}', '${formatStringForSql(
    JSON.stringify(song.lyrics)
  )}')`;
}

/**
 * Runs a SQL Query which reads from the DB.
 *
 * @param query - SQL Query to be executed.
 * @param descriptor - Little message about the query, solely for debugging purposes.
 * @param callback - Function that takes a list of songs as a parameter and returns anything.
 * When the SQL Query gets the rows from the DB, it will call the callback function with the retrieved data.
 *
 * This function itself does not return anything.
 */
function runQueryWithCallback(query: string, descriptor: string, callback: (songs: DbSong[]) => void): void {
  const songsTable = DbManager.getInstance().getSongsTable;
  if (songsTable === undefined) {
    console.log(`Cannot run SQL ${descriptor} because DB is undefined.`);
    callback([]);
    return;
  }
  try {
    const startTime = Date.now();
    if (!isCordova()) {
      // Not Mobile:
      const sql = songsTable as Database;
      sql.transaction((transaction) => {
        transaction.executeSql(
          query,
          [],
          (_transaction, response) => {
            const songs = mapToSongList(response);
            console.log(`Returning ${response.rows.length} rows on ${descriptor} in ${Date.now() - startTime} millis.`);
            callback(songs);
          },
          (_transaction, error) => {
            console.log(`WebSQL query error: ${descriptor}, ${error.message}.`);
            callback([]);
            return false;
          }
        );
      });
    } else {
      // Mobile:
      const sql = songsTable as SQLiteObject;
      sql.executeSql(query, []).then((response) => {
        const songs = mapToSongList(response);
        console.log(`Returning ${response.rows.length} rows on ${descriptor} in ${Date.now() - startTime} millis.`);
        callback(songs);
      });
    }
  } catch (e) {
    console.log(`SQL query error: ${descriptor}, ${e}.`);
    callback([]);
  }
}

/**
 * Runs a SQL Query where no return value is expected.
 */
function runQuery(query: string, descriptor: string): void {
  const songsTable = DbManager.getInstance().getSongsTable;
  if (songsTable === undefined) {
    console.log(`Cannot run SQL ${descriptor} because DB is undefined.`);
    return;
  }
  try {
    const startTime = Date.now();
    if (!isCordova()) {
      // Not Mobile:
      const sql = songsTable as Database;
      sql.transaction((transaction) => {
        transaction.executeSql(
          query,
          [],
          () => {
            console.log(`Successfully ran query ${descriptor} in ${Date.now() - startTime} millis.`);
          },
          (_transaction, error) => {
            console.log(`WebSQL query error: ${descriptor}, ${error.message}.`);
            return false;
          }
        );
      });
    } else {
      // Mobile:
      const sql = songsTable as SQLiteObject;
      sql.executeSql(query, []).then(() => {
        console.log(`Successfully ran query ${descriptor} in ${Date.now() - startTime} millis.`);
      });
    }
  } catch (e) {
    console.log(`SQL query error: ${descriptor}, ${e}.`);
  }
}

/**
 * Wrapper for running a query where only 1 return value is expected.
 */
function runQuerySingle(query: string, descriptor: string, callback: (song: DbSong | null) => void): void {
  runQueryWithCallback(query, descriptor, (songs: DbSong[]) => {
    if (songs.length >= 1) {
      callback(songs[0]);
    } else {
      callback(null);
    }
  });
}

/**
 * Formats a string with single quotes to using escape characters for SQL input.
 * The returned string must be surrounded by double quotes in the sql query.
 */
function formatStringForSql(value: string): string {
  return value.replace(/'/g, "''");
}

/**
 * Maps a list of rows from the DB to a list of DbSongs.
 */
function mapToSongList(rows: SQLResultSet): DbSong[] {
  const songs: DbSong[] = [];
  for (let i = 0; i < rows.rows.length; i++) {
    songs.push(mapToDbSong(rows.rows.item(i)));
  }
  return songs;
}

/**
 * Maps a DB Row from the songs table to a DbSong Object.
 */
function mapToDbSong(row: { [x: string]: string | number | boolean }): DbSong {
  return new DbSong(
    row[SONG_NUMBER] as number,
    row[BOOK_ID] as string,
    row[NUM_HITS] as number,
    row[LAST_USED] as number,
    row[FAVORITED] as boolean,
    row[AUTHOR] as string,
    row[TITLE] as string,
    row[LYRICS] as string
  );
}
