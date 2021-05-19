import { SongViewMode } from "../utils/SongUtils";
import { Event } from "./GoogleAnalytics";

export function triggerSongView(songNumber: number, mode: SongViewMode): void {
  try {
    Event("INTERACTION", `Song viewed(${SongViewMode[mode]})`, songNumber.toString());
    console.debug(`Song number: ${String(songNumber)} viewed in ${SongViewMode[mode]} mode`);
  } catch (e) {
    console.error(e);
  }
}
