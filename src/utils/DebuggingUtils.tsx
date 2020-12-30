/** Utility functions for Debugging purposes. */

/**
 * This function takes in a promise and runs it, logging how long that promise took to run.
 * Good for testing how long asynchronous functions take to run.
 */
export function logPromiseTime(promise: Promise<void>, name = "Method"): void {
  const start = Date.now();

  promise.then(() => {
    const duration = Date.now() - start;
    console.log(`${name} took ${duration} milliseconds to execute.`);
  });
}

/**
 * Delays a bit of time, useful for detecting race conditions.
 * Usage: `await delay(500)` inside of an async function to wait for half a second.
 */
export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Delays a bit of time then runs the callback function, simulating a laggy network call.
 */
export async function lagItWithCallback(ms: number, callback: ((word: string) => void)): Promise<void> {
  await delay(ms);
  callback("Callback called after delaying for " + ms + " ms.")
}

/**
 * Force lags an async function.
 */
export async function lagIt(ms: number): Promise<string> {
  await delay(ms);
  return "returning after delaying for " + ms + " ms."
}