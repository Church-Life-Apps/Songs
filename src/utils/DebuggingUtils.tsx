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
