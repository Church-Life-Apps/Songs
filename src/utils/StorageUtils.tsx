import { Plugins } from "@capacitor/core";
import { shlJsonUrl, shlName, Song } from "./SongUtils";

/**
 * Utilities for storing Simple Key-Value pair data locally.
 * On web this uses browser cache, on Android it uses SharedPreferences, on iOS it uses UserDefaults.
 */

const { Storage } = Plugins;

export const shlKey = "shl";

export const YES = "yes";
export const NO = "no";

// Try to get the songs metadata from local cache storage. Otherwise, try to get it from online.
export async function getShlSongs(): Promise<Song[]> {
  return getItem(shlKey)
    .then(async (item) => {
      if (!item) {
        const response = await fetch(shlJsonUrl);
        const body = await response.json();
        storeItem(shlKey, JSON.stringify(body));
        // TODO (Brandon): Use Database instead of JSON.
        // populateDatabase(body[shlName], 1);
        return body[shlName];
      } else {
        return JSON.parse(item)[shlName];
      }
    })
    .catch((r) => {
      console.error(r);
      return [];
    });
}

/**
 * Stores an item with given key/value pair. The value can be any string, including JSON strings.
 * If an item with that key already existed, it will overwrite the value.
 */
export async function storeItem(key: string, value: string) {
  return Storage.set({
    key: key,
    value: value,
  }).catch((error) => {
    console.log(`Error storing item because ${error}.`);
  });
}

/**
 * Retrieves an item with the given key, or blank if not found.
 */
export async function getItem(key: string): Promise<string> {
  let value = (await Storage.get({ key: key })).value;
  if (value === null) {
    return "";
  }
  return value;
}

/**
 * Clears all values from the storage cache.
 */
export function clearCache(): void {
  console.log("Clearing Local Cache.");
  Storage.clear();
}
