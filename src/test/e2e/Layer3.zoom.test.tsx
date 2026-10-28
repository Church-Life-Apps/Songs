/**
 * LAYER 3 — Swipe and full-screen sheet music viewer (live data).
 *
 * Guards the sheet music viewer:
 *  - With the viewer closed, one-finger swipes still change songs, and stop at the
 *    first and last song.
 *  - Tapping the sheet music opens it full screen. Swiping does not change the song
 *    while it is open. The X (or the back button) closes it, and swiping works again.
 *  - A pinch inside the viewer zooms only the image. The page itself never zooms
 *    (visualViewport.scale stays 1).
 *  - Text inputs use a font size of at least 16px, so focusing them does not
 *    make iPhone Safari zoom the page.
 *  - Desktop: clicking the music opens the viewer, the mouse wheel zooms the image,
 *    and the X closes it.
 *
 * Runs in Puppeteer's Chromium with mobile emulation (touch + iPhone UA). iPhone
 * Safari-specific behavior (real pinch, home-screen mode) still needs a real device.
 *
 * Where a check asserts that a swipe did NOT change the song, the test then makes
 * one normal swipe and waits for exactly the next song number. If the blocked
 * swipe had navigated, that final song number would be off by one, so a late
 * navigation cannot slip past the assertion.
 */
import {
  Browser,
  BookId,
  Song,
  launchBrowser,
  newPage,
  getSongs,
  gotoSongLyric,
  toggleToMusic,
  waitForLyricTitleNumber,
  openSettings,
  swipe,
  pinch,
  selectors,
  bookUrl,
  songUrl,
  delay,
  Page,
} from "../helpers/e2e";

const BOOK_IDS: BookId[] = ["shl", "sfog"];

// A song known to exist in both books with a sheet-music image.
const SAMPLE_SONG: Record<BookId, number> = { shl: 6, sfog: 6 };

let browser: Browser;
// Live data caches keyed by book.
const songLists: Partial<Record<BookId, Song[]>> = {};

beforeAll(async () => {
  browser = await launchBrowser();
  const boot = await newPage(browser, "desktop");
  for (const b of BOOK_IDS) {
    songLists[b] = await getSongs(boot, b);
  }
  await boot.close();
}, 90000);

afterAll(async () => {
  if (browser) await browser.close();
});

/** Wait until the page URL is exactly the given song. */
async function waitForSongUrl(page: Page, bookId: BookId, songNumber: number): Promise<void> {
  await page.waitForFunction(url => window.location.href === url, { timeout: 15000 }, songUrl(bookId, songNumber));
}

/** Wait until the sheet-music image src is for the given song. */
async function waitForMusicSong(page: Page, songNumber: number): Promise<void> {
  const frag = `_${String(songNumber).padStart(3, "0")}`;
  await page.waitForFunction(
    (sel, f) => {
      const el = document.querySelector(sel as string) as HTMLImageElement | null;
      return !!el && (el.getAttribute("src") || "").includes(f as string);
    },
    { timeout: 15000 },
    selectors.musicView,
    frag
  );
}

/** Size and position of the image inside the viewer, plus the window size. */
async function getViewerImageBox(
  page: Page
): Promise<{ left: number; top: number; width: number; height: number; windowWidth: number; windowHeight: number }> {
  return page.$eval(selectors.musicViewerImage, e => {
    const r = e.getBoundingClientRect();
    return {
      left: r.left,
      top: r.top,
      width: r.width,
      height: r.height,
      windowWidth: window.innerWidth,
      windowHeight: window.innerHeight,
    };
  });
}

/** Browser page zoom level (visualViewport.scale), 1 when the page is not zoomed. */
async function getPageScale(page: Page): Promise<number> {
  return page.evaluate(() => (window.visualViewport ? window.visualViewport.scale : 1));
}

/** Wait until the viewer image has been laid out and has stopped moving (its open animation is done). */
async function waitForViewerSettled(page: Page): Promise<void> {
  await page.waitForSelector(selectors.musicViewerImage, { visible: true, timeout: 8000 });
  let last = "";
  for (let i = 0; i < 20; i++) {
    const box = JSON.stringify(await getViewerImageBox(page));
    if (box === last) return;
    last = box;
    await delay(150);
  }
}

/** Open the viewer by tapping (mobile) or clicking (desktop) the sheet music. */
async function openViewer(page: Page, mobile: boolean): Promise<void> {
  const box = await page.$eval(selectors.musicView, e => {
    const r = e.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: Math.min(r.top + r.height / 2, window.innerHeight - 50) };
  });
  if (mobile) {
    await page.touchscreen.tap(Math.round(box.x), Math.round(box.y));
  } else {
    await page.mouse.click(Math.round(box.x), Math.round(box.y));
  }
  await waitForViewerSettled(page);
}

/** Wait until the viewer is gone. */
async function waitForViewerClosed(page: Page): Promise<void> {
  await page.waitForFunction(sel => !document.querySelector(sel as string), { timeout: 8000 }, selectors.musicViewer);
}

/* ----------------------------------------------------------------------------
 * Swipe navigation with the viewer closed (mobile) — unchanged behavior.
 * ------------------------------------------------------------------------- */
describe("Swipe without the viewer (mobile)", () => {
  it.each(BOOK_IDS)(
    "[%s] swipe on sheet music: left → next, right → prev",
    async bookId => {
      const page = await newPage(browser, "mobile");
      try {
        const n = SAMPLE_SONG[bookId];
        await gotoSongLyric(page, bookId, n);
        await toggleToMusic(page, n);
        await delay(1200); // let the swipe gesture mount
        await swipe(page, -260); // left → next
        await waitForSongUrl(page, bookId, n + 1);
        await waitForMusicSong(page, n + 1);
        await delay(800);
        await swipe(page, 260); // right → prev
        await waitForSongUrl(page, bookId, n);
        await waitForMusicSong(page, n);
        // A swipe never opens the viewer.
        expect(await page.$(selectors.musicViewer)).toBeNull();
      } finally {
        await page.close();
      }
    },
    60000
  );

  it.each(BOOK_IDS)(
    "[%s] swipe right at song 1 and swipe left at the last song do not move",
    async bookId => {
      const last = Math.max(...(songLists[bookId] as Song[]).map(s => s.songNumber));
      const page = await newPage(browser, "mobile");
      try {
        await gotoSongLyric(page, bookId, 1);
        await delay(1200);
        await swipe(page, 260); // right → prev, but already at 1
        await delay(1200);
        expect(page.url()).toBe(songUrl(bookId, 1));

        await gotoSongLyric(page, bookId, last);
        await delay(1200);
        await swipe(page, -260); // left → next, but already at the last song
        await delay(1200);
        expect(page.url()).toBe(songUrl(bookId, last));
        await waitForLyricTitleNumber(page, last);
      } finally {
        await page.close();
      }
    },
    60000
  );
});

/* ----------------------------------------------------------------------------
 * Full-screen sheet music viewer (mobile).
 * ------------------------------------------------------------------------- */
describe("Sheet music viewer (mobile)", () => {
  it.each(BOOK_IDS)(
    "[%s] tap opens the viewer, swipe does not change song while open, X closes it, swipe works again",
    async bookId => {
      const page = await newPage(browser, "mobile");
      try {
        const n = SAMPLE_SONG[bookId];
        await gotoSongLyric(page, bookId, n);
        await toggleToMusic(page, n);
        await delay(1200); // let the swipe gesture mount

        // Tap: the viewer covers the screen and shows this song's music, fitted to the screen.
        await openViewer(page, true);
        const viewer = await page.$eval(selectors.musicViewer, e => {
          const r = e.getBoundingClientRect();
          return { width: r.width, height: r.height, windowWidth: window.innerWidth, windowHeight: window.innerHeight };
        });
        expect(viewer.width).toBe(viewer.windowWidth);
        expect(viewer.height).toBe(viewer.windowHeight);
        const src = await page.$eval(selectors.musicViewerImage, e => e.getAttribute("src"));
        expect(src).toContain(`_${String(n).padStart(3, "0")}`);
        const box = await getViewerImageBox(page);
        expect(box.width).toBeLessThanOrEqual(box.windowWidth + 1);
        expect(box.height).toBeLessThanOrEqual(box.windowHeight + 1);
        // The image sits clear of the close button.
        const close = await page.$eval(selectors.musicViewerClose, e => e.getBoundingClientRect().bottom);
        expect(box.top).toBeGreaterThanOrEqual(close);

        // Swipes inside the viewer must not change song.
        await swipe(page, -260);
        await delay(1200);
        expect(page.url()).toBe(songUrl(bookId, n));
        await swipe(page, 260);
        await delay(1200);
        expect(page.url()).toBe(songUrl(bookId, n));
        expect(await page.$(selectors.musicViewer)).not.toBeNull();

        // X closes it and leaves the user on the same song.
        await page.tap(selectors.musicViewerClose);
        await waitForViewerClosed(page);
        expect(page.url()).toBe(songUrl(bookId, n));
        await waitForMusicSong(page, n);

        // Swiping works again and moves exactly one song.
        await delay(800);
        await swipe(page, -260);
        await waitForSongUrl(page, bookId, n + 1);
        await waitForMusicSong(page, n + 1);
      } finally {
        await page.close();
      }
    },
    60000
  );

  it.each(BOOK_IDS)(
    "[%s] pinch inside the viewer zooms the image, not the page",
    async bookId => {
      const page = await newPage(browser, "mobile");
      try {
        const n = SAMPLE_SONG[bookId];
        await gotoSongLyric(page, bookId, n);
        await toggleToMusic(page, n);
        await openViewer(page, true);
        const before = await getViewerImageBox(page);

        await pinch(page, before.windowWidth / 2, before.windowHeight / 2, 2.5);
        await page.waitForFunction(
          (sel, w) => (document.querySelector(sel as string) as HTMLElement).getBoundingClientRect().width > w * 1.5,
          { timeout: 8000 },
          selectors.musicViewerImage,
          before.width
        );
        await waitForViewerSettled(page);
        const zoomed = await getViewerImageBox(page);
        expect(zoomed.width).toBeGreaterThan(before.width * 1.5);
        // Only the image changed. The page is not zoomed and the song did not change.
        expect(await getPageScale(page)).toBeCloseTo(1, 2);
        expect(page.url()).toBe(songUrl(bookId, n));

        // A one-finger drag pans the zoomed image instead of changing song.
        await swipe(page, -200);
        await delay(1200);
        const panned = await getViewerImageBox(page);
        expect(panned.left).toBeLessThan(zoomed.left - 20);
        expect(page.url()).toBe(songUrl(bookId, n));
        expect(await getPageScale(page)).toBeCloseTo(1, 2);

        // Closing resets everything: the song page is unzoomed and swipe works.
        await page.tap(selectors.musicViewerClose);
        await waitForViewerClosed(page);
        expect(await getPageScale(page)).toBeCloseTo(1, 2);
        await delay(800);
        await swipe(page, -260);
        await waitForSongUrl(page, bookId, n + 1);
        await waitForMusicSong(page, n + 1);
      } finally {
        await page.close();
      }
    },
    60000
  );

  it("back button closes the viewer and stays on the song (SHL)", async () => {
    const page = await newPage(browser, "mobile");
    try {
      const n = SAMPLE_SONG.shl;
      await gotoSongLyric(page, "shl", n);
      await toggleToMusic(page, n);
      await openViewer(page, true);
      await page.evaluate(() => window.history.back());
      await waitForViewerClosed(page);
      await delay(800);
      expect(page.url()).toBe(songUrl("shl", n));
      await waitForMusicSong(page, n);

      // Opening and closing with the X leaves no extra history entry: back now leaves the song.
      await openViewer(page, true);
      await page.tap(selectors.musicViewerClose);
      await waitForViewerClosed(page);
      await delay(800);
      expect(page.url()).toBe(songUrl("shl", n));
      await page.evaluate(() => window.history.back());
      await page.waitForFunction(url => window.location.href !== url, { timeout: 8000 }, songUrl("shl", n));
    } finally {
      await page.close();
    }
  }, 60000);
});

/* ----------------------------------------------------------------------------
 * Input font size — at least 16px so iPhone Safari does not zoom on focus.
 * ------------------------------------------------------------------------- */
describe("Input font size (mobile)", () => {
  it("song-number search and feedback form inputs are at least 16px", async () => {
    const page = await newPage(browser, "mobile");
    try {
      await page.goto(bookUrl("shl"), { waitUntil: "domcontentloaded" });
      await page.waitForSelector(selectors.searchBar, { timeout: 15000 });
      const searchSize = await page.$eval(selectors.searchBar, e => parseFloat(getComputedStyle(e).fontSize));
      expect(searchSize).toBeGreaterThanOrEqual(16);

      await gotoSongLyric(page, "shl", SAMPLE_SONG.shl);
      await openSettings(page);
      // The settings modal slides up on mobile; wait for the button to be visible, then click it in the page.
      await page.waitForSelector(selectors.submitFeedbackButton, { visible: true, timeout: 8000 });
      await page.$eval(selectors.submitFeedbackButton, e => (e as HTMLElement).click());
      await page.waitForSelector(`${selectors.feedbackFormDiv} ion-textarea textarea`, { timeout: 8000 });
      await page.waitForFunction(
        sel => document.querySelectorAll(sel as string).length >= 2,
        { timeout: 8000 },
        `${selectors.feedbackFormDiv} ion-input input`
      );
      const sizes = await page.$$eval(
        `${selectors.feedbackFormDiv} ion-input input, ${selectors.feedbackFormDiv} ion-textarea textarea`,
        els => els.map(e => parseFloat(getComputedStyle(e).fontSize))
      );
      expect(sizes.length).toBe(3);
      for (const size of sizes) {
        expect(size).toBeGreaterThanOrEqual(16);
      }
    } finally {
      await page.close();
    }
  }, 50000);
});

/* ----------------------------------------------------------------------------
 * Desktop — click opens the viewer, the wheel zooms the image, X closes it.
 * ------------------------------------------------------------------------- */
describe("Sheet music viewer (desktop)", () => {
  it.each(BOOK_IDS)(
    "[%s] click opens the viewer, wheel zooms the image, X closes it",
    async bookId => {
      const page = await newPage(browser, "desktop");
      try {
        const n = SAMPLE_SONG[bookId];
        await gotoSongLyric(page, bookId, n);
        await toggleToMusic(page, n);
        const pageImageWidth = await page.$eval(selectors.musicView, e => e.getBoundingClientRect().width);

        await openViewer(page, false);
        const before = await getViewerImageBox(page);
        await page.mouse.move(Math.round(before.windowWidth / 2), Math.round(before.windowHeight / 2));
        for (let i = 0; i < 5; i++) {
          await page.mouse.wheel({ deltaY: -200 });
          await delay(50);
        }
        await page.waitForFunction(
          (sel, w) => (document.querySelector(sel as string) as HTMLElement).getBoundingClientRect().width > w * 1.3,
          { timeout: 8000 },
          selectors.musicViewerImage,
          before.width
        );

        await page.click(selectors.musicViewerClose);
        await waitForViewerClosed(page);
        expect(page.url()).toBe(songUrl(bookId, n));
        // The music on the song page is unchanged.
        const after = await page.$eval(selectors.musicView, e => e.getBoundingClientRect().width);
        expect(after).toBeCloseTo(pageImageWidth, 0);
      } finally {
        await page.close();
      }
    },
    50000
  );

  it("Escape closes the viewer (SHL)", async () => {
    const page = await newPage(browser, "desktop");
    try {
      const n = SAMPLE_SONG.shl;
      await gotoSongLyric(page, "shl", n);
      await toggleToMusic(page, n);
      await openViewer(page, false);
      await page.keyboard.press("Escape");
      await waitForViewerClosed(page);
      await delay(800);
      expect(page.url()).toBe(songUrl("shl", n));
    } finally {
      await page.close();
    }
  }, 40000);
});
