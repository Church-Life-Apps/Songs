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
 * Insert a song into the Songs Table with default values.
 */
export function insertSong(songNumber: number, bookId: number, author: string, title2: string, lyrics: string): void {
  //const author = author2.replaceAll("\\", "'")
  const title = title2.replace(/'/g, "''")
  const author2 = author.replace(/'/g, "''")
  const lyric2 = lyrics.replace(/'/g, "''")
  console.log("number " + songNumber + ", title = " + title2 + ", title after = " + title);

  //const author = author2.replaceAll("\\", "'")

  const query2 = `INSERT INTO ${SONGS_TABLE} VALUES(?, ?, ?, ?)`

  const query = `INSERT INTO ${SONGS_TABLE} values(${songNumber}, ${bookId}, 0, 0, false, '${author2}', '${title}', '${lyric2}')`;

  runQuery(query, `Insert song number ${songNumber}`);
}

/**
 * Increments the num_hits by 1 and updates last_used time to now for the song number provided.
 */
export function updateSongHits(songNumber: number): void {
  const query =
    `UPDATE ${SONGS_TABLE} SET ${NUM_HITS}=${NUM_HITS} + 1 ` +
    `AND ${LAST_USED}=${Date.now()} WHERE ${SONG_NUMBER}=${songNumber}`;

  runQuery(query, `Update hits for song ${songNumber}.`);
}

/**
 * Updates the favorited field for the provided song number.
 */
export function updateSongFavorited(songNumber: number, favorited: boolean): void {
  const query = `UPDATE ${SONGS_TABLE} SET ${FAVORITED}=${favorited} WHERE ${SONG_NUMBER}=${songNumber}`;

  runQuery(query, `Set ${songNumber} favorited to ${favorited}.`);
}

/**
 * Retrieves the song from the DB for the requested song number.
 */
export function getSong(songNumber: string, callback: (song: DbSong | null) => any): void {
  const query = `SELECT * FROM ${SONGS_TABLE} WHERE ${SONG_NUMBER}=${songNumber}`;

  runQuerySingle(query, `Getting song ${songNumber}`, callback);
}

/**
 * Gets all songs from the database sorted by when they were last used.
 */
export function getSongsSortedByLastUsed(callback: (songs: DbSong[]) => any): void {
  const query = `SELECT * FROM ${SONGS_TABLE} ORDER BY ${LAST_USED} DESC`;

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
 * Lists all songs saved in the DB, default sorted by last_used.
 */
export function listSongsBySearchText(searchText: string, callback: (songs: DbSong[]) => any): void {
  // let query = ""
  //if (searchText === "") {
  const query = `SELECT * FROM ${SONGS_TABLE} ORDER BY ${SONG_NUMBER} ASC`;
  //}

  // finish this - copy GetSearchParams in SearchView.tsx

  runQueryWithCallback(query, "List all songs", callback);
}

/**
 * Deletes all rows from the database.
 */
export function clearDatabase() {
  const query = `DELETE FROM ${SONGS_TABLE}`;

  runQueryWithCallback(query, "Deleting all songs");
}

export function populateDatabase(songs: Song[], bookId: number) {
  // const time = Date.now()

  for (var i = 0; i < songs.length; ++i) {
    const song = songs[i];
    insertSong(song.songNumber, bookId, song.author, song.title, JSON.stringify(song.lyrics));
  }

  // let query = `BEGIN TRANSACTION; \n`;
  // for (let i = 1; i <= 10; i++) {
  //   query += `INSERT INTO ${SONGS_TABLE} VALUES (${i}, 0, ${time}, false); \n`;
  // }
  // query += `COMMIT;`;
  // console.log(`inserting all songs into the DB with query: ${query}`);
  // runQuery(query, 'Inserting all songs into DB');
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
      // websql
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
      // mobile
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
      // websql
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
      // mobile
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
