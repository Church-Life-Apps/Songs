import { DbSong } from "../models/DbSong";
import { isCordova } from "../utils/PlatformUtils";
import { DbManager, FAVORITED, LAST_USED, NUM_HITS, SONGS_TABLE, SONG_NUMBER } from "./DbManager";

/**
 * Insert a song into the Songs Table with default values.
 */
export function insertSong(songNumber: number): void {
  const query = `INSERT INTO ${SONGS_TABLE} values(${songNumber}, 0, ${Date.now()}, false)`;

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

  return runQuery(query, `Select songs ordered by last_used.`, callback);
}

/**
 * Gets all favorited songs from the database.
 */
export function getFavoriteSongs(callback: (songs: DbSong[]) => any): void {
  const query = `SELECT * FROM ${SONGS_TABLE} WHERE ${FAVORITED}=true ORDER BY ${NUM_HITS} DESC`;

  runQuery(query, `Select Favorited Songs`, callback);
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

  runQuery(query, "List all songs", callback);
}

/**
 * Deletes all rows from the database.
 */
export function clearDatabase() {
  const query = `DELETE FROM ${SONGS_TABLE}`;

  runQuery(query, "Deleting all songs");
}

export function populateDatabase() {
  // const time = Date.now()
  for (let i = 1; i < 10; ++i) {
    insertSong(i);
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
 * Generic Query running function. Descriptor is solely for debugging purposes.
 * Returns a list of rows that were returned from the query response mapped into DbSong objects.
 */
function runQuery(query: string, descriptor: string, callback: (songs: DbSong[]) => any = () => {}): void {
  try {
    let sql = DbManager.getInstance().getSongsTable;
    if (sql === undefined) {
      console.log(`Cannot run SQL ${descriptor} because DB is undefined.`);
      callback([]);
      return;
    }
    try {
      let st = Date.now();

      if (!isCordova()) {
        sql.transaction((transaction) => {
          transaction.executeSql(
            query,
            [],
            (_transaction: any, response: any) => {
              const songs = mapToSongList(response);
              console.log(`Returning ${response.rows.length} rows on ${descriptor} after ${Date.now() - st} millis.`);
              callback(songs);
            },
            (_transaction: any, error: any) => {
              console.log(`WebSQL query error: ${descriptor}, ${error.message}.`);
              callback([]);
            }
          );
        });
      } else {
        sql.executeSql(query, []).then((response) => {
          const songs = mapToSongList(response);
          console.log(`Returning ${response.rows.length} rows on ${descriptor} after ${Date.now() - st} millis.`);
          callback(songs);
        });
      }
    } catch (e) {
      console.log(`SQL query error: ${descriptor}, ${e}.`);
      callback([]);
    }
  } catch (e) {
    console.log(`DB Error: ${descriptor}, ${e}.`);
    callback([]);
  }
}

/**
 * Wrapper for running a query where only 1 return value is expected.
 */
function runQuerySingle(query: string, descriptor: string, callback: (song: DbSong | null) => any): void {
  runQuery(query, descriptor, (songs: DbSong[]) => {
    if (songs.length >= 1) {
      callback(songs[0]);
    } else {
      callback(null);
    }
  });
}

/** MAPPERS */
/**
 * Maps a resulting row from the songs table to a DbSong Object.
 */

function mapToSongList(rs: any): DbSong[] {
  let songs: DbSong[] = [];
  for (var i = 0; i < rs.rows.length; i++) {
    songs.push(mapToDbSong(rs.rows.item(i)));
  }
  return songs;
}

function mapToDbSong(resultSet: any): DbSong {
  return new DbSong(resultSet[SONG_NUMBER], resultSet[NUM_HITS], resultSet[LAST_USED], resultSet[FAVORITED]);
}
