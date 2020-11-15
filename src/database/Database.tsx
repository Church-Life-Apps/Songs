import { SQLiteObject, SQLite, SQLiteDatabaseConfig } from "@ionic-native/sqlite";
import { isCordova } from "../utils/PlatformUtils";
import { getItem, storeItem, YES } from "../utils/StorageUtils";
import { populateDatabase } from "./SongsTable";

const SCHEMA = "hymnal";
export const SONGS_TABLE = "songs_test_4";

const SQL_DB_NAME = `${SCHEMA}.${SONGS_TABLE}`;
const SONGS_TABLE_CONFIG: SQLiteDatabaseConfig = {
  name: SQL_DB_NAME,
  location: "default",
};

export const DATABASE_INITIALIZED = "databaseInitialized";
export const LYRICS_ONLY_MODE = "lyricsOnlyMode";

/**
 * Overall Database stuff.
 * This class defines all the tables and instantiates them as a singleton database object when the app starts up.
 */
export class Database {
  private static instance: Database;
  private songsTable: SQLiteObject | undefined;

  /**
   * Constructs the SQLiteObject used to make queries.
   * Creating the DB is asynchronous so just initiate it when the app starts and hope the
   * DB is not called again too quickly after so the sqlLiteObject has time to initialize.
   */
  private constructor() {
    if (isCordova()) {
      SQLite.create(SONGS_TABLE_CONFIG).then((db) => {
        this.songsTable = db;
        db.executeSql(CREATE_SONGS_TABLE, []).then(() => {
          // After creating songs table, populate it with values if not populated yet.
          getItem(DATABASE_INITIALIZED).then((response) => {
            if (response !== YES) {
              console.log("Database not initialized yet, Initializing.");
              populateDatabase();
              storeItem(DATABASE_INITIALIZED, YES);
            }
          });
        });
      });
    } else {
      // Setting up DB for browser.
      // var dbs = openDatabase({ name: 'UserDatabase.db' });
      // let db = window.openDatabase(SQL_DB_NAME, '1.0', 'DEV', 5 * 1024 * 1024);
      // this.dbInstance = browserDBInstance(db);
    }
  }

  get getSongsTable() {
    return this.songsTable;
  }

  static getInstance(): Database {
    if (!Database.instance) {
      Database.instance = new Database();
    }
    return Database.instance;
  }
}

/**
 * Songs Table Constants and CREATE query.
 */
export const SONG_NUMBER = "song_number";
export const NUM_HITS = "num_hits";
export const LAST_USED = "last_used";
export const FAVORITED = "favorited";

const CREATE_SONGS_TABLE = `CREATE TABLE IF NOT EXISTS ${SONGS_TABLE}(
    ${SONG_NUMBER} int primary key,
    ${NUM_HITS} int,
    ${LAST_USED} datetime,
    ${FAVORITED} boolean
);`;
