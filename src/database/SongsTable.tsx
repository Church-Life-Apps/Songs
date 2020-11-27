import { SQLiteObject } from "@ionic-native/sqlite";
import { DbSong } from "../models/DbSong";
import { isCordova } from "../utils/PlatformUtils";
import { Song } from "../utils/SongUtils";
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
export function getSong(songNumber: number, callback: (song: DbSong | null) => any): void {
  updateSongHits(songNumber);

  const query = `SELECT * FROM ${SONGS_TABLE} WHERE ${SONG_NUMBER}=${songNumber}`;
  runQuerySingle(query, `Getting song ${songNumber}`, callback);
}

/**
 * Updates the favorited field for the provided song number.
 */
export function updateSongFavorited(songNumber: number, favorited: boolean): void {
  const query = `UPDATE ${SONGS_TABLE} SET ${FAVORITED}=${favorited} WHERE ${SONG_NUMBER}=${songNumber}`;

  runQuery(query, `Set ${songNumber} favorited to ${favorited}.`);
}

/**
 * Gets all songs from the database sorted by when they were last used.
 */
export function getSongsSortedByLastUsed(callback: (songs: DbSong[]) => any): void {
  const query = `SELECT * FROM ${SONGS_TABLE} WHERE ${LAST_USED} > 0 ORDER BY ${LAST_USED} DESC`;

  return runQueryWithCallback(query, `Select songs ordered by last_used.`, callback);
}

/**
 * Gets all favorited songs from the database.
 */
export function getFavoriteSongs(callback: (songs: DbSong[]) => any): void {
  const query = `SELECT * FROM ${SONGS_TABLE} WHERE ${FAVORITED}=true ORDER BY ${NUM_HITS} DESC`;

  runQueryWithCallback(query, `Select Favorited Songs`, callback);
}

/**
 * Lists all songs in the DB that match the text.
 *
 * This is really naive right now and does not sort by accuracy.
 * TODO (Brandon): Use full text search and return rows ordered by hit accuracy.
 */
export function listSongsBySearchText(searchText: string, callback: (songs: DbSong[]) => any): void {
  const query = `SELECT * FROM ${SONGS_TABLE} WHERE ${AUTHOR} LIKE '%${searchText}%' 
  OR ${TITLE} LIKE '%${searchText}%' 
  OR ${LYRICS} LIKE '%${searchText}%'`;

  runQueryWithCallback(query, `List songs by search text: "${searchText}"`, callback);
}

/**
 * Increments the num_hits by 1 and updates last_used time to now for the song number provided.
 */
function updateSongHits(songNumber: number): void {
  const query =
    `UPDATE ${SONGS_TABLE} SET ${NUM_HITS}=${NUM_HITS} + 1 ` +
    `AND ${LAST_USED}=${Date.now()} WHERE ${SONG_NUMBER}=${songNumber}`;

  runQuery(query, `Update hits for song ${songNumber}.`);
}

/**
 * Deletes all rows from the database. DANGEROUS!
 */
function clearDatabase(): void {
  const query = `DELETE FROM ${SONGS_TABLE}`;
  runQuery(query, "Deleting all songs");
}

/**
 * Given a list of Songs, populate the database with that song list and book id.
 * For both mobile/browser, Keep all queries under 1 transaction. Multiple transactions are more expensive.
 */
export function populateDatabase(songs: Song[], bookId: number): void {
  let songsTable = DbManager.getInstance().getSongsTable;
  if (songsTable === undefined) {
    console.log(`Cannot populate DB it is undefined.`);
    return;
  }
  try {
    let startTime = Date.now();
    if (!isCordova()) {
      // Not Mobile.
      const sql = songsTable as Database;
      sql.transaction(
        (transaction) => {
          for (var i = 0; i < songs.length; ++i) {
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
      let queries: string[] = [];
      for (var i = 0; i < songs.length; ++i) {
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
function getInsertSongQuery(song: Song, bookId: number): string {
  return `INSERT INTO ${SONGS_TABLE} values(${song.songNumber}, ${bookId}, 0, 0, false, '${formatStringForSql(
    song.author
  )}', '${formatStringForSql(song.title)}', '${formatStringForSql(JSON.stringify(song.lyrics))}')`;
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
function runQueryWithCallback(query: string, descriptor: string, callback: (songs: DbSong[]) => any = () => {}): void {
  let songsTable = DbManager.getInstance().getSongsTable;
  if (songsTable === undefined) {
    console.log(`Cannot run SQL ${descriptor} because DB is undefined.`);
    callback([]);
    return;
  }
  try {
    let startTime = Date.now();
    if (!isCordova()) {
      // Not Mobile:
      const sql = songsTable as Database;
      sql.readTransaction((transaction) => {
        transaction.executeSql(
          query,
          [],
          (_transaction: any, response: any) => {
            const songs = mapToSongList(response);
            console.log(`Returning ${response.rows.length} rows on ${descriptor} in ${Date.now() - startTime} millis.`);
            callback(songs);
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
      sql.executeSql(query, []).then((response) => {
        const songs = mapToSongList(response);
        console.log(`Returning ${response.rows.length} rows on ${descriptor} in ${Date.now() - startTime} millis.`);
        callback(songs);
      });
    }
  } catch (e) {
    console.log(`SQL query error: ${descriptor}, ${e}.`);
  }
}

/**
 * Runs a SQL Query where no return value is expected.
 */
function runQuery(query: string, descriptor: string): void {
  let songsTable = DbManager.getInstance().getSongsTable;
  if (songsTable === undefined) {
    console.log(`Cannot run SQL ${descriptor} because DB is undefined.`);
    return;
  }
  try {
    let startTime = Date.now();
    if (!isCordova()) {
      // Not Mobile:
      const sql = songsTable as Database;
      sql.transaction((transaction) => {
        transaction.executeSql(
          query,
          [],
          (_transaction, _response) => {
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
      sql.executeSql(query, []).then((response) => {
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
function runQuerySingle(query: string, descriptor: string, callback: (song: DbSong | null) => any): void {
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
function mapToSongList(rows: any): DbSong[] {
  let songs: DbSong[] = [];
  for (var i = 0; i < rows.rows.length; i++) {
    songs.push(mapToDbSong(rows.rows.item(i)));
  }
  return songs;
}

/**
 * Maps a DB Row from the songs table to a DbSong Object.
 */
function mapToDbSong(row: any): DbSong {
  return new DbSong(
    row[SONG_NUMBER],
    row[BOOK_ID],
    row[NUM_HITS],
    row[LAST_USED],
    row[FAVORITED],
    row[AUTHOR],
    row[TITLE],
    row[LYRICS]
  );
}
