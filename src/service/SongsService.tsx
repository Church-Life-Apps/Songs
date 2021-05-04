import { shlJsonUrl, SHL_RESOURCE_JSON_KEY, Song } from "../utils/SongUtils";
import { getSimilarity, isNumeric, removePunctuation } from "../utils/StringUtils";

/**
 * File which handles retrieving and searching for songs.
 */

// TODO: Extract values like this to be configurable outside of code so we can tweak on the fly.
const MATCH_THRESHOLD = 0.4;

let shlSongs: Song[] | undefined = undefined;

/**
 * Fetches the lyrics and stores it in memory as a variable. 
 * Refreshing the page will cause another fetch.
 */
async function getOrfetchSongs(): Promise<Song[]> {
    if (shlSongs === undefined) {
        const response = await fetch(shlJsonUrl)
        const body = await response.json()
        const songs = body[SHL_RESOURCE_JSON_KEY];
        shlSongs = songs;
        console.debug("Fetching lyrics");
        return songs;
    } else {
        console.debug("Returning stored lyrics");
        return shlSongs;
    }
}

/**
 * Retrieves a single song based on song number.
 */
export async function getSong(number: number): Promise<Song> {
    const songs = await getOrfetchSongs();
    if (number < 0 || number >= songs.length) {
        return { title:"", author: "", songNumber: -1, lyrics: JSON.parse("{}") };
    } else {
        return songs[number - 1];
    }
}

/**
 * Returns a list of songs filtered and sorted by how well they match the given searchString.
 */
export async function listSongs(searchString: string): Promise<Song[]> {
    const songs = await getOrfetchSongs();
    if (searchString === "") {
        return songs;
    } else if (isNumeric(searchString)) {
        return songs.filter(song => song.songNumber.toString().startsWith(searchString));
    } else {
        return songs
        .filter(song => getMatchScore(song, searchString) > MATCH_THRESHOLD)
        .sort((song1, song2) => getMatchScore(song2, searchString) - getMatchScore(song1, searchString));
    }
}

/**
 * Returns a number based on how well the song matches the search string.
 * 
 * TODO: Improve how we determine matches against title/author.
 * TODO: Enhance this to also include searching through lyrics.
 * 
 * Notes:
 * This has to be fast. Optimimzations may include some kind of predefined lookup dictionary,
 * or storing past searches.
 */
function getMatchScore(song: Song, searchString: string): number {
    let matchBonus = 0;
    if (removePunctuation(song.title.toLowerCase()).includes(searchString)) {
        matchBonus += .2;
    }
    return matchBonus + getSimilarity(song.title, searchString) + getSimilarity(song.author, searchString);
}
