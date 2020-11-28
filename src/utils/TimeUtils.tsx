/**
 * Utility functions related to time.
 */

export const MILLIS_PER_SECOND = 1000;
export const MILLIS_PER_MINUTE = 60 * MILLIS_PER_SECOND;
export const MILLIS_PER_HOUR = 60 * MILLIS_PER_MINUTE;
export const MILLIS_PER_DAY = 24 * MILLIS_PER_HOUR;
export const MILLIS_PER_WEEK = 7 * MILLIS_PER_DAY;
export const MILLIS_PER_MONTH = 30 * MILLIS_PER_DAY;
export const MILLIS_PER_YEAR = 365 * MILLIS_PER_DAY;

/**
 * Turns a timestamp from milliseconds to a formatted Date.
 */
export function formatDate(timeInMillis: number): string {
  const date = new Date(timeInMillis);
  return date.toUTCString();
}

/**
 * Returns how long ago a timestamp was from now, or how far into the future it is.
 */
export function describeTime(timeInMillis: number): string {
  if (timeInMillis === 0) {
    return "";
  }
  let howLongAgo = Date.now() - timeInMillis;
  let past = true;
  if (howLongAgo < 0) {
    past = false;
    howLongAgo = howLongAgo * -1;
  }
  let number = 0;
  let unit = "";
  if (howLongAgo > MILLIS_PER_DAY) {
    number = Math.round(howLongAgo / MILLIS_PER_DAY);
    unit = "days";
    if (number === 1) {
      unit = "day";
    }
  } else if (howLongAgo > MILLIS_PER_HOUR) {
    number = Math.round(howLongAgo / MILLIS_PER_HOUR);
    unit = "hours";
    if (number === 1) {
      unit = "hour";
    }
  } else if (howLongAgo > MILLIS_PER_MINUTE) {
    number = Math.round(howLongAgo / MILLIS_PER_MINUTE);
    unit = "minutes";
    if (number === 1) {
      unit = "minute";
    }
  } else {
    number = Math.round(howLongAgo / MILLIS_PER_SECOND);
    unit = "seconds";
    if (number === 1) {
      unit = "second";
    }
  }
  if (past) {
    return `${number} ${unit} ago.`;
  } else {
    return `In ${number} ${unit}.`;
  }
}
