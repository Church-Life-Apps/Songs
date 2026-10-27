/**
 * LAYER 3 — Mobile zoom and swipe (live data).
 *
 * Guards the "allow zoom on mobile without accidental song changes" fix:
 *  - With no zoom, one-finger swipes still change songs, and stop at the first
 *    and last song.
 *  - A real browser pinch zoom (CDP Input.synthesizePinchGesture) is allowed on
 *    the song page, and swipes do NOT change songs while zoomed in. After zooming
 *    back out, swiping works again.
 *  - Two-finger sideways drags never change songs.
 *  - Double tapping the sheet music on a phone enlarges it past the screen width
 *    so it can be panned, pausing swipe navigation until it is restored.
 *  - Text inputs use a font size of at least 16px, so focusing them does not
 *    make iPhone Safari zoom the page.
 *  - Desktop mouse double-click still enlarges and restores the sheet music.
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
  getSongbook,
  getSongs,
  gotoSongLyric,
  toggleToMusic,
  waitForLyricTitleNumber,
  openSettings,
  swipe,
  twoFingerSwipe,
  pinch,
  getPageScale,
  doubleTap,
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
    await getSongbook(boot, b);
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

/** Rendered width of the sheet music, the window width and whether it is marked enlarged. */
async function getMusicState(page: Page): Promise<{ width: number; windowWidth: number; enlarged: boolean }> {
  return page.$eval(selectors.musicView, e => ({
    width: e.getBoundingClientRect().width,
    windowWidth: window.innerWidth,
    enlarged: e.classList.contains("enlarged"),
  }));
}

/** Double tap the centre of the sheet music with a finger. */
async function doubleTapMusic(page: Page): Promise<void> {
  const box = await page.$eval(selectors.musicView, e => {
    const r = e.getBoundingClientRect();
    // Stay inside the visible part of the image (it can be wider than the screen when enlarged).
    return { x: Math.min(r.left + r.width / 2, window.innerWidth / 2), y: Math.min(r.top + 200, r.bottom - 10) };
  });
  await doubleTap(page, Math.round(box.x), Math.round(box.y));
}

/** Wait until the sheet music enlarged state matches `enlarged`. */
async function waitForMusicEnlarged(page: Page, enlarged: boolean): Promise<void> {
  await page.waitForFunction(
    (sel, want) => {
      const el = document.querySelector(sel as string);
      if (!el) return false;
      const wide = el.getBoundingClientRect().width > window.innerWidth + 1;
      return el.classList.contains("enlarged") === want && wide === want;
    },
    { timeout: 8000 },
    selectors.musicView,
    enlarged
  );
}

/* ----------------------------------------------------------------------------
 * No zoom — one-finger swipe navigation is unchanged (mobile).
 * ------------------------------------------------------------------------- */
describe("Swipe without zoom (mobile)", () => {
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
 * Pinch zoom — a real Chromium pinch; swipes are paused while zoomed in.
 * ------------------------------------------------------------------------- */
describe("Pinch zoom (mobile)", () => {
  it.each(BOOK_IDS)(
    "[%s] lyrics can be pinch-zoomed, swipe does not change song while zoomed, works again after zoom out",
    async bookId => {
      const page = await newPage(browser, "mobile");
      try {
        const n = SAMPLE_SONG[bookId];
        await gotoSongLyric(page, bookId, n);
        await delay(1200); // let the swipe gesture mount

        // Zoom in. Before the fix the song page refused pinch zoom (scale stayed 1).
        await pinch(page, 2);
        await page.waitForFunction(() => !!window.visualViewport && window.visualViewport.scale > 1.5, {
          timeout: 8000,
        });

        // One-finger sideways drags pan the zoomed page; they must not change song.
        await swipe(page, -260);
        await delay(1200);
        expect(page.url()).toBe(songUrl(bookId, n));
        await swipe(page, 260);
        await delay(1200);
        expect(page.url()).toBe(songUrl(bookId, n));

        // Zoom back out, then a normal swipe navigates to exactly the next song.
        await pinch(page, 0.5);
        await page.waitForFunction(() => !!window.visualViewport && window.visualViewport.scale <= 1.01, {
          timeout: 8000,
        });
        expect(await getPageScale(page)).toBeLessThanOrEqual(1.01);
        await delay(800);
        await swipe(page, -260);
        await waitForSongUrl(page, bookId, n + 1);
        await waitForLyricTitleNumber(page, n + 1);
      } finally {
        await page.close();
      }
    },
    60000
  );
});

/* ----------------------------------------------------------------------------
 * Two-finger drags — never change song (mobile).
 * ------------------------------------------------------------------------- */
describe("Two-finger drag (mobile)", () => {
  it.each(BOOK_IDS)(
    "[%s] two-finger sideways drags do not change song",
    async bookId => {
      const page = await newPage(browser, "mobile");
      try {
        const n = SAMPLE_SONG[bookId];
        await gotoSongLyric(page, bookId, n);
        await delay(1200); // let the swipe gesture mount
        await twoFingerSwipe(page, -260);
        await delay(1200);
        expect(page.url()).toBe(songUrl(bookId, n));
        await twoFingerSwipe(page, 260);
        await delay(1200);
        expect(page.url()).toBe(songUrl(bookId, n));

        // A normal one-finger swipe afterwards still navigates to exactly the next song.
        await swipe(page, -260);
        await waitForSongUrl(page, bookId, n + 1);
        await waitForLyricTitleNumber(page, n + 1);
      } finally {
        await page.close();
      }
    },
    60000
  );
});

/* ----------------------------------------------------------------------------
 * Sheet music double tap — enlarge, pan without changing song, restore (mobile).
 * ------------------------------------------------------------------------- */
describe("Sheet music double tap (mobile)", () => {
  it.each(BOOK_IDS)(
    "[%s] double tap enlarges past the screen, sideways drags pan without changing song, double tap restores",
    async bookId => {
      const page = await newPage(browser, "mobile");
      try {
        const n = SAMPLE_SONG[bookId];
        await gotoSongLyric(page, bookId, n);
        await toggleToMusic(page, n);
        await delay(1200); // let the swipe gesture mount
        const before = await getMusicState(page);
        expect(before.enlarged).toBe(false);
        expect(before.width).toBeLessThanOrEqual(before.windowWidth + 1);

        // Enlarge: the rendered image is wider than the screen (Ionic's max-width cap is lifted).
        await doubleTapMusic(page);
        await waitForMusicEnlarged(page, true);
        const enlarged = await getMusicState(page);
        expect(enlarged.width).toBeCloseTo(before.width * 2, 0);

        // The page can scroll sideways across the enlarged music.
        const scroll = await page.evaluate(async () => {
          const content = document.getElementById("song-page-body") as HTMLIonContentElement;
          const el = await content.getScrollElement();
          return { scrollWidth: el.scrollWidth, clientWidth: el.clientWidth };
        });
        expect(scroll.scrollWidth).toBeGreaterThan(scroll.clientWidth);

        // Sideways drags while enlarged pan the music; they must not change song.
        await swipe(page, -260);
        await delay(1200);
        expect(page.url()).toBe(songUrl(bookId, n));
        await swipe(page, 260);
        await delay(1200);
        expect(page.url()).toBe(songUrl(bookId, n));
        expect((await getMusicState(page)).enlarged).toBe(true);

        // Restore with a second double tap; then swiping navigates to exactly the next song.
        await doubleTapMusic(page);
        await waitForMusicEnlarged(page, false);
        const restored = await getMusicState(page);
        expect(restored.width).toBeCloseTo(before.width, 0);
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

  it("switching to lyrics while the music is enlarged leaves no sideways scroll and swipe works (SHL)", async () => {
    const page = await newPage(browser, "mobile");
    try {
      const n = SAMPLE_SONG.shl;
      await gotoSongLyric(page, "shl", n);
      await toggleToMusic(page, n);
      await delay(1200); // let the swipe gesture mount
      await doubleTapMusic(page);
      await waitForMusicEnlarged(page, true);

      // Back to lyrics while still enlarged.
      await page.click(selectors.songViewToggler);
      await page.waitForSelector(selectors.lyricViewIonCardTitle, { timeout: 15000 });
      await waitForLyricTitleNumber(page, n);
      await page.waitForFunction(
        () => !document.getElementById("song-page-body")?.classList.contains("allow-sideways-pan"),
        {
          timeout: 8000,
        }
      );
      const scroll = await page.evaluate(async () => {
        const content = document.getElementById("song-page-body") as HTMLIonContentElement;
        const el = await content.getScrollElement();
        return { scrollWidth: el.scrollWidth, clientWidth: el.clientWidth, scrollLeft: el.scrollLeft };
      });
      expect(scroll.scrollWidth).toBeLessThanOrEqual(scroll.clientWidth);
      expect(scroll.scrollLeft).toBe(0);

      // Swiping is no longer paused.
      await delay(800);
      await swipe(page, -260);
      await waitForSongUrl(page, "shl", n + 1);
      await waitForLyricTitleNumber(page, n + 1);

      // Music view opens at normal size again.
      await toggleToMusic(page, n + 1);
      const music = await getMusicState(page);
      expect(music.enlarged).toBe(false);
      expect(music.width).toBeLessThanOrEqual(music.windowWidth + 1);
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
 * Desktop — mouse double-click still enlarges and restores the sheet music.
 * ------------------------------------------------------------------------- */
describe("Sheet music double-click (desktop)", () => {
  it.each(BOOK_IDS)(
    "[%s] double-click enlarges then restores the rendered music width",
    async bookId => {
      const page = await newPage(browser, "desktop");
      try {
        const n = SAMPLE_SONG[bookId];
        await gotoSongLyric(page, bookId, n);
        await toggleToMusic(page, n);
        const before = await getMusicState(page);
        await page.click(selectors.musicView, { clickCount: 2 });
        await page.waitForFunction(
          (sel, w) => (document.querySelector(sel as string) as HTMLElement).getBoundingClientRect().width > w * 1.5,
          { timeout: 8000 },
          selectors.musicView,
          before.width
        );
        const enlarged = await getMusicState(page);
        expect(enlarged.width).toBeCloseTo(before.width * 2, 0);
        await page.click(selectors.musicView, { clickCount: 2 });
        await page.waitForFunction(
          (sel, w) => (document.querySelector(sel as string) as HTMLElement).getBoundingClientRect().width < w * 1.5,
          { timeout: 8000 },
          selectors.musicView,
          before.width
        );
        const restored = await getMusicState(page);
        expect(restored.width).toBeCloseTo(before.width, 0);
        expect(page.url()).toBe(songUrl(bookId, n));
      } finally {
        await page.close();
      }
    },
    50000
  );
});
