import { describeTime } from '../utils/TimeUtils';

/**
 * Model for a DbSong object in the Songs table
 */
export class DbSong {
  constructor(public songNumber: number, public numHits: number, public lastUsed: number, public favorited: boolean) {}

  public toString = (): string => {
    return `Song ${this.songNumber}, numHits: ${this.numHits}, lastUsed: ${describeTime(this.lastUsed)}, favorited: ${
      this.favorited
    }.`;
  };
}
