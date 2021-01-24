import { getSimilarity, removePunctuation } from "../utils/StringUtils";
import { describeTime } from "../utils/TimeUtils";

/**
 * Model for a DbSong object in the Songs table
 */
export class DbSong {
  constructor(
    public songNumber: number,
    public bookId: string,
    public numHits: number,
    public lastUsed: number,
    public favorited: boolean,
    public author: string,
    public title: string,
    public lyrics: string
  ) {}

  public toString = (): string => {
    return `Song ${this.songNumber} in book ${this.bookId}: ${this.title} by ${this.author}. numHits: ${
      this.numHits
    }, lastUsed: ${describeTime(this.lastUsed)}, favorited: ${this.favorited}.`;
  };
}

export const PLACEHOLDER_SONG = new DbSong(0, "", 0, 0, false, "", "", "{}");

// Songs that match below this threshold will be ordered by number. Usually this means the song got matched by author.
const MATCH_THRESHOLD = 0.22;

/**
 * Sorts a list of DbSongs based on how closely they match to the given searchText.
 */
export function sortDbSongs(songs: DbSong[], searchText: string): DbSong[] {
  const search = removePunctuation(searchText.toLowerCase());
  return songs.sort((a, b) => {
    const scoreA = getMatchScore(a, search);
    const scoreB = getMatchScore(b, search);
    if (scoreA <= MATCH_THRESHOLD && scoreB <= MATCH_THRESHOLD) {
      return a.songNumber - b.songNumber;
    }
    return scoreB - scoreA;
  });
}

/**
 * Gets a score determining how well the song matches the search text.
 * The title is much shorter by length, so matches in the title will naturally weigh more than matches in the lyrics.
 */
function getMatchScore(song: DbSong, search: string) {
  return getSimilarity(song.title, search) + getSimilarity(song.lyrics, search) + getSimilarity(song.author, search);
}
