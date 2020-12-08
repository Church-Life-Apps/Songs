import { Event } from "./GoogleAnalytics";

export function triggerSongView(songNumber: number, mode: String) {
  try {
    Event("INTERACTION", `Song viewed(${mode})`, String(songNumber));
    console.log(`Song number: ${String(songNumber)} viewed in ${mode} mode`);
  } catch (e) {
    console.error(e);
  }
}
