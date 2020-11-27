import { SQLiteObject, SQLite, SQLiteDatabaseConfig } from "@ionic-native/sqlite";
import { isCordova } from "../utils/PlatformUtils";

const VERSION = "1.0";
const SCHEMA = `hymnal_1`;
export const SONGS_TABLE = `songs_1`;

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
   * DB is not called again too quickly after so the songsTable object has time to initialize.
   */
  private constructor() {
    if (isCordova()) {
      // Mobile app, use SQLite.
      try {
        SQLite.create(SONGS_TABLE_CONFIG).then((db) => {
          this.songsTable = db;
          db.executeSql(CREATE_SONGS_TABLE).then(() => {
            console.log(`Successfully opened SQLite database schema ${SCHEMA} and created table: ${SONGS_TABLE}.`);
          });
        });
      } catch (e) {
        console.log("Error creating SQLite database: " + e + e.message);
      }
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
            console.log(`Successfully opened WebSQL database schema: ${SCHEMA} and created table: ${SONGS_TABLE}.`);
          }
        );
        this.songsTable = db;
      } catch (e) {
        console.log("Error creating the WebSQL database: " + e + e.message);
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
