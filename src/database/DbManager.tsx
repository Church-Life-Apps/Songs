import { SQLiteObject, SQLite, SQLiteDatabaseConfig } from "@ionic-native/sqlite";
import { create } from "domain";
import { DbSong } from "../models/DbSong";
import { isCordova } from "../utils/PlatformUtils";
import { getItem, storeItem, YES } from "../utils/StorageUtils";
import { populateDatabase } from "./SongsTable";

const SCHEMA = "hymnal_test_6";
export const SONGS_TABLE = "songs_test_7";
const VERSION = "1.0";

const SQL_DB_NAME = `${SCHEMA}.${SONGS_TABLE}`;
const SONGS_TABLE_CONFIG: SQLiteDatabaseConfig = {
  name: SQL_DB_NAME,
  location: "default",
};

export const DATABASE_INITIALIZED = "databaseInitialized";
export const LYRICS_ONLY_MODE = "lyricsOnlyMode";
declare var window: any;

/**
 * Overall Database stuff.
 * This class defines all the tables and instantiates them as a singleton database object when the app starts up.
 */
export class DbManager {
  private static instance: DbManager;
  private songsTable: SQLiteObject | Database | undefined;

  /**
   * Constructs the SQLiteObject used to make queries.
   * Creating the DB is asynchronous so just initiate it when the app starts and hope the
   * DB is not called again too quickly after so the sqlLiteObject has time to initialize.
   */
  private constructor() {
    if (isCordova()) {
      // Mobile app, use SQLite.
      SQLite.create(SONGS_TABLE_CONFIG).then((db) => {
        this.songsTable = db;
        db.executeSql(CREATE_SONGS_TABLE, []).then(() => {
          // After creating songs table, populate it with values if not populated yet.
          getItem(DATABASE_INITIALIZED).then((response) => {
            if (response !== YES) {
              // this.createIndexes(db);

              console.log("Database not initialized yet, Initializing.");
              // populateDatabase();
              storeItem(DATABASE_INITIALIZED, YES);
            }
          });
        });
      });
    } else {
      // Not Mobile app, so use WebSQL to generate the SQLiteObject used for queries.
      try {
        let db: Database = window.openDatabase(SCHEMA, VERSION, SQL_DB_NAME, 5 * 1024 * 1024);
        db.changeVersion(
          VERSION,
          VERSION,
          (transaction) => {
            transaction.executeSql(CREATE_SONGS_TABLE);
          },
          (error) => {
            console.log(`Error creating database ${SQL_DB_NAME} because ${error}, ${error.message}`);
          },
          () => {
            console.log(`Successfully opened WebSQL database schema: ${SCHEMA} and created table: ${SONGS_TABLE}`);
          }
        );

        this.songsTable = db;
      } catch (e) {
        console.log("Errored creating the WebSQL database." + e + e.message);
      }
    }
  }

  get getSongsTable() {
    return this.songsTable;
  }

  static getInstance(): DbManager {
    if (!DbManager.instance) {
      DbManager.instance = new DbManager();
    }
    return DbManager.instance;
  }

  createIndexes(sql: SQLiteObject) {
    try {
      indexes.forEach((column) => {
        sql.executeSql(getCreateIndexQuery(column));
      });
    } catch (e) {
      console.log("Error creating indexes for songs table.");
    }
  }
}

/**
 * Songs Table Constants and CREATE query.
 */
export const SONG_NUMBER = "song_number";
export const BOOK_ID = "book_id";
export const NUM_HITS = "num_hits";
export const LAST_USED = "last_used";
export const FAVORITED = "favorited";
export const AUTHOR = "author";
export const TITLE = "title";
export const LYRICS = "lyrics";

const indexes = [NUM_HITS, LAST_USED, FAVORITED];

// const CREATE_SONGS_TABLE = `CREATE TABLE IF NOT EXISTS ${SONGS_TABLE}(
//     ${SONG_NUMBER} int primary key,
//     ${NUM_HITS} int,
//     ${LAST_USED} datetime,
//     ${FAVORITED} boolean
//     );`;

const CREATE_SONGS_TABLE = `CREATE TABLE IF NOT EXISTS ${SONGS_TABLE}(
  ${SONG_NUMBER} int,
  ${BOOK_ID} int,
  ${NUM_HITS} int,
  ${LAST_USED} datetime,
  ${FAVORITED} boolean,
  ${AUTHOR} text,
  ${TITLE} text,
  ${LYRICS} text,
  primary key (${SONG_NUMBER}, ${BOOK_ID})
);`;

function getCreateIndexQuery(column: string): string {
  return `CREATE INDEX ${column}_index IF NOT EXISTS ON ${SONGS_TABLE}(${column});`;
}

/**
 *
 * TODO:
 *
 * add the new fields back into the songs object
 * on load parse through the big json and insert all the songs.
 * Return the json on the FIRST LOAD
 *
 *
 * refactor
 * clean up
 * test cases???
 *
 *
 *
 */
