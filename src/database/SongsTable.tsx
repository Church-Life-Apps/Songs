import { DbSong } from '../models/DbSong';
import { isCordova } from '../utils/PlatformUtils';
import { Database, FAVORITED, LAST_USED, NUM_HITS, SONGS_TABLE, SONG_NUMBER } from './Database';

/**
 * Insert a song into the Songs Table with default values.
 */
export function insertSong(songNumber: number): void {
  const query = `INSERT INTO ${SONGS_TABLE} values(${songNumber}, 0, ${Date.now()}, false) ON CONFLICT DO NOTHING`;

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
export async function getSong(songNumber: string): Promise<DbSong | undefined> {
  const query = `SELECT * FROM ${SONGS_TABLE} WHERE ${SONG_NUMBER}=${songNumber}`;

  return runQuerySingle(query, `Getting song ${songNumber}`);
}

/**
 * Gets all songs from the database sorted by when they were last used.
 */
export function getSongsSortedByLastUsed(): Promise<DbSong[]> {
  const query = `SELECT * FROM ${SONGS_TABLE} ORDER BY ${LAST_USED} DESC`;

  return runQuery(query, `Select songs ordered by last_used.`);
}

/**
 * Gets all favorited songs from the database.
 */
export function getFavoriteSongs(): Promise<DbSong[]> {
  const query = `SELECT * FROM ${SONGS_TABLE} WHERE ${FAVORITED}=true ORDER BY ${NUM_HITS} DESC`;

  return runQuery(query, `Select Favorited Songs`);
}

/**
 * Lists all songs saved in the DB, default sorted by last_used.
 */
export async function listSongs(): Promise<DbSong[]> {
  const query = `SELECT * FROM ${SONGS_TABLE} ORDER BY ${SONG_NUMBER} ASC`;

  return runQuery(query, 'List all songs');
}

/**
 * Deletes all rows from the database.
 */
export function clearDatabase() {
  const query = `DELETE FROM ${SONGS_TABLE}`;

  runQuery(query, 'Deleting all songs');
}

export function populateDatabase() {
  // const time = Date.now()
  for (let i = 1; i < 533; ++i) {
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
async function runQuery(query: string, descriptor: string): Promise<DbSong[]> {
  if (!isCordova()) {
    return Promise.resolve([]);
  }
  try {
    let sql = Database.getInstance().getSongsTable;
    if (sql === undefined) {
      console.log(`Cannot run SQL ${descriptor} because DB is undefined.`);
      return Promise.resolve([]);
    }
    try {
      let startTime = Date.now();
      return sql.executeSql(query, []).then((response) => {
        let songs: DbSong[] = [];
        for (var i = 0; i < response.rows.length; i++) {
          songs.push(mapToDbSong(response.rows.item(i)));
        }
        console.log(
          `Returning ${response.rows.length} rows for query ${descriptor} after ${Date.now() - startTime} millis.`
        );
        return songs;
      });
    } catch (e) {
      console.log(`SQL query error: ${descriptor}, ${e}.`);
      return Promise.resolve([]);
    }
  } catch (e) {
    console.log(`DB Error: ${descriptor}, ${e}.`);
    return Promise.resolve([]);
  }
}

/**
 * Wrapper for running a query where only 1 return value is expected.
 */
async function runQuerySingle(query: string, descriptor: string): Promise<DbSong | undefined> {
  return runQuery(query, descriptor).then((results) => {
    if (results.length >= 1) {
      return results[0];
    }
    return undefined;
  });
}

/** MAPPERS */
/**
 * Maps a resulting row from the songs table to a DbSong Object.
 */
function mapToDbSong(resultSet: any): DbSong {
  return new DbSong(resultSet[SONG_NUMBER], resultSet[NUM_HITS], resultSet[LAST_USED], resultSet[FAVORITED]);
}
