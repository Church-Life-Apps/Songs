import { shlJsonUrl, SHL_RESOURCE_JSON_KEY, Song } from "../utils/SongUtils";
import { getSimilarity, isNumeric, normalize, tokenize } from "../utils/StringUtils";

/**
 * File which handles retrieving and searching for songs.
 */

let shlSongs: Song[] | undefined = undefined;

/**
 * Lightweight caches string tokenizations. These are reset on refresh.
 */
const normalizedLyrics: Map<number, string> = new Map<number, string>();
const tokenizedLyrics: Map<number, string[]> = new Map<number, string[]>();

/**
 * Fetches the lyrics and stores it in memory as a variable.
 * Refreshing the page will cause another fetch.
 */
async function getOrfetchSongs(): Promise<Song[]> {
  if (shlSongs === undefined) {
    const response = await fetch(shlJsonUrl);
    const body = await response.json();
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
    return { title: "", author: "", songNumber: -1, lyrics: JSON.parse("{}") };
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
    return songs.filter((song) => song.songNumber.toString().startsWith(searchString));
  } else {
    // Build a cache to speed up duplicate calls
    const matchScores: Map<number, number> = new Map<number, number>();
    songs.forEach((song) => {
      matchScores.set(song.songNumber, getMatchScore(song, searchString));
    });

    console.log(matchScores);

    return songs
      .filter((song) => (matchScores.get(song.songNumber) as number) > 0)
      .sort(
        (song1, song2) => (matchScores.get(song2.songNumber) as number) - (matchScores.get(song1.songNumber) as number)
      );
  }
}

// TODO: Extract values like this to be configurable outside of code so we can tweak on the fly.

// This is a very strict threshold. In order for two strings to have similarity > 0.9,
// they need to either be exactly the same, or only 1 letter off for every 10 or so letters.
const similarityThreshold = 0.9;

// If the entire search string is a substring of the title or author, we should give the highest score.
const titleMatchScore = 1000;
const authorMatchScore = 900;

// Score for each word that matches title or author.
const titleTokenMatchScore = 100;
const authorTokenMatchScore = 90;

// If the entire search string is a substring of the lyric line, add 10.
// We want this to have more influence than token matches in title or author,
// but less influence than a title/author match on the entire search string.
const lyricMatchScore = 500;

// We want lyric token matches to help distinguish between songs, but not
// override any title/author token matches, so we pick a very low number here.
const lyricTokenMatchScore = 1;

/**
 * Returns a number based on how well the song matches the search string.
 *
 * Notes:
 * This has to be fast. Optimimzations may include some kind of predefined lookup dictionary,
 * or storing past searches.
 */
function getMatchScore(song: Song, searchString: string): number {
  let matchScore = 0;

  const search = normalize(searchString);
  const searchTokens = tokenize(search);

  const title = normalize(song.title);
  const titleTokens = tokenize(title);

  const author = normalize(song.author);
  const authorTokens = tokenize(author);

  // Check matches in title
  if (title.includes(search)) {
    matchScore += titleMatchScore;
  } else {
    for (const word of titleTokens) {
      for (const searchTerm of searchTokens) {
        if (getSimilarity(word, searchTerm) > similarityThreshold) {
          matchScore += titleTokenMatchScore;
        }
      }
    }
  }

  // Check matches in author
  if (author.includes(search)) {
    matchScore += authorMatchScore;
  } else {
    for (const word of authorTokens) {
      for (const searchTerm of searchTokens) {
        if (getSimilarity(word, searchTerm) > similarityThreshold) {
          matchScore += authorTokenMatchScore;
        }
      }
    }
  }

  // Populate local client-side caches if they are empty.
  if (!normalizedLyrics.has(song.songNumber)) {
    normalizedLyrics.set(
      song.songNumber,
      Object.values(song.lyrics)
        .map((s) => normalize(String(s)))
        .join(" ") as string
    );
  }

  if (!tokenizedLyrics.has(song.songNumber)) {
    tokenizedLyrics.set(song.songNumber, tokenize(normalizedLyrics.get(song.songNumber) as string));
  }

  // Check matches in lyrics
  if ((normalizedLyrics.get(song.songNumber) as string).includes(search)) {
    matchScore += lyricMatchScore;
  } else {
    for (const word of tokenizedLyrics.get(song.songNumber) as string[]) {
      for (const searchTerm of searchTokens) {
        if (getSimilarity(word, searchTerm) > similarityThreshold) {
          matchScore += lyricTokenMatchScore;
        }
      }
    }
  }

  return matchScore;
}
