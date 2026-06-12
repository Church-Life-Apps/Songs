import puppeteer, { Browser, Page } from "puppeteer";

/**
 * Shared helpers for the comprehensive Songs e2e suite.
 *
 * Design notes:
 * - Uses LIVE data. Song metadata (titles, authors, presentation order) and the
 *   sheet-music PNGs are fetched at runtime from the Church-Life-Apps/Resources
 *   repo, exactly as the app does. We intentionally do NOT commit a snapshot of
 *   Resources into this repo, so the suite exercises the real network path.
 * - bookId and viewport are parameterized so every feature can be run across
 *   {SHL, SFOG} x {mobile, desktop}.
 */

export const baseUrl = "http://localhost:8080";

export const SONGBOOKS_URL =
  "https://raw.githubusercontent.com/Church-Life-Apps/Resources/master/resources/songbooks.json";

export const BOOKS = {
  shl: { id: "shl", name: "Songs and Hymns of Life" },
  sfog: { id: "sfog", name: "Songs For Our Generation" },
};

export type BookId = "shl" | "sfog";

// Viewports used to drive the mobile vs desktop responsive code paths.
export const VIEWPORTS = {
  mobile: { width: 390, height: 844 },
  desktop: { width: 1366, height: 768 },
};

// A realistic iPhone user-agent so Ionic's isPlatform("mobile"/"mobileweb")
// detection treats the page as a mobile-web client (drives swipe gesture path,
// hides desktop-only prev/next FABs, etc.).
export const MOBILE_UA =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 " +
  "(KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1";

export const selectors = {
  searchBar: "#searchBar > input",
  appName: "#appName",
  shlSongbook: "#shl > ion-card-title",
  sfogSongbook: "#sfog > ion-card-title",
  songbookCard: ".songbookCardView",
  searchViewIonCard: "#searchViewSongList > ion-card",
  searchViewIonCardTitle: "#searchViewSongList > ion-card > ion-card-title",
  lyricViewCard: "#lyricViewCard",
  lyricViewIonCardTitle: "#lyricViewCard > ion-card-header > ion-card-title",
  lyricViewAuthor: "#lyricViewCard > ion-card-header > ion-card-subtitle",
  musicView: "#musicView",
  songViewToggler: "#songViewToggler",
  songToggler: "#songToggler", // second-tune toggle wrapper (SHL only)
  songTogglerToggle: "#songToggler > ion-toggle",
  lyricVerseName: "#lyricViewCard > ion-card-content > h5",
  lyricLine: "#lyricViewCard > ion-card-content > ion-text > p",
  noResultsFoundLabel: "#root > div > ion-content > ion-item > ion-label",
  nextButton: "#nextButton",
  prevButton: "#prevButton",
  downloadMusicButton: "#music-download-button",
  settingsButton: "ion-buttons[slot=end] > ion-button:last-child",
  settingsModal: "#settingsModal",
  settingsTitle: "#settingsTitle",
  darkModeToggle: "#settingsModal ion-toggle[name=darkMode]",
  submitFeedbackButton: "#settingsModal ion-button",
  returnToHymnalButton: "#returnToHymnalButton",
  feedbackFormDiv: "#feedbackFormDiv",
  feedbackResponseModal: "#feedbackResponseModal",
  feedbackResponseText: "#feedbackResponseModal h1",
  searchClearButton: "ion-item ion-button[shape=round]",
};

export interface Song {
  title: string;
  author: string;
  songNumber: number;
  presentation: string;
  lyrics: { [key: string]: string[] };
}

export interface Songbook {
  name: string;
  bookId: string;
  lyricsUrl: string;
  musicUrl: string;
}

// Module-level cache of live data, populated once per suite run.
const songbookCache: Map<string, Songbook> = new Map();
const songsCache: Map<string, Song[]> = new Map();

export async function launchBrowser(): Promise<Browser> {
  return puppeteer.launch({
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });
}

/**
 * Creates a fresh page for the given form factor and navigates to the app root.
 * For mobile we set a mobile UA + touch emulation so Ionic's platform detection
 * and the swipe gesture code path are exercised.
 */
export async function newPage(browser: Browser, formFactor: "mobile" | "desktop" = "desktop"): Promise<Page> {
  const page = await browser.newPage();
  if (formFactor === "mobile") {
    await page.setUserAgent(MOBILE_UA);
    await page.setViewport({ ...VIEWPORTS.mobile, isMobile: true, hasTouch: true });
  } else {
    await page.setViewport(VIEWPORTS.desktop);
  }
  await page.goto(baseUrl, { waitUntil: "domcontentloaded" });
  return page;
}

export function bookUrl(bookId: string): string {
  return `${baseUrl}/#/${bookId}`;
}

export function songUrl(bookId: string, songNumber: number): string {
  return `${baseUrl}/#/${bookId}/${songNumber}`;
}

/**
 * Fetches the live songbook metadata (lyricsUrl/musicUrl) for a bookId.
 * Runs the fetch from within the page so the request originates from the
 * localhost origin (raw.githubusercontent.com sends Access-Control-Allow-Origin: *).
 */
export async function getSongbook(page: Page, bookId: string): Promise<Songbook> {
  if (songbookCache.has(bookId)) {
    return songbookCache.get(bookId) as Songbook;
  }
  const book = await page.evaluate(
    async (url, id) => {
      const res = await fetch(url);
      const json = await res.json();
      return (json.songbooks as Songbook[]).find(b => b.bookId === id);
    },
    SONGBOOKS_URL,
    bookId
  );
  if (!book) throw new Error(`Songbook not found for id ${bookId}`);
  songbookCache.set(bookId, book as Songbook);
  return book as Songbook;
}

/**
 * Fetches the live song list for a book (titles, authors, presentation, lyrics).
 */
export async function getSongs(page: Page, bookId: string): Promise<Song[]> {
  if (songsCache.has(bookId)) {
    return songsCache.get(bookId) as Song[];
  }
  const book = await getSongbook(page, bookId);
  const songs = await page.evaluate(
    async (url, name) => {
      const res = await fetch(url);
      const json = await res.json();
      return json[name] as Song[];
    },
    book.lyricsUrl,
    book.name
  );
  songsCache.set(bookId, songs as Song[]);
  return songs as Song[];
}

export function getSong(songs: Song[], songNumber: number): Song {
  const s = songs.find(x => x.songNumber === songNumber);
  if (!s) throw new Error(`Song ${songNumber} not found`);
  return s;
}

export function makeThreeDigits(num: number): string {
  if (num < 10) return `00${num}`;
  if (num < 100) return `0${num}`;
  return `${num}`;
}

/**
 * Replicates the app's getVerseText label mapping (LyricView.tsx) so tests can
 * compute the expected verse-label sequence from a song's presentation string.
 */
export function verseLabel(key: string): string {
  const lower = key.toLowerCase();
  const prefix = lower.charAt(0);
  const rest = lower.slice(1);
  const labels: { [k: string]: string } = {
    i: "Interlude",
    v: "Verse",
    c: "Chorus",
    b: "Bridge",
    p: "Pre-Chorus",
    t: "Tag",
    e: "Ending",
  };
  const label = labels[prefix];
  if (!label) return key;
  return rest ? `${label} ${rest}` : label;
}

/**
 * Expected ordered verse labels for a song, given its presentation string.
 * When a song has no presentation field the app interleaves choruses; these
 * sampled songs all declare presentation, so we use the simple mapping.
 */
export function expectedPresentationLabels(presentation: string): string[] {
  if (!presentation) return [];
  return presentation
    .split(" ")
    .filter(p => p.length > 0)
    .map(verseLabel);
}

export function expectedImageUrl(book: Songbook, songNumber: number, secondTune = false): string {
  return `${book.musicUrl}${makeThreeDigits(songNumber)}${secondTune ? "-B" : ""}.png`;
}

/**
 * Fetches a URL from within the page and returns status + content-type.
 * Used to assert sheet-music images are real PNGs (HTTP 200, image/png) and
 * NOT an HTML error page (guards issue #211).
 */
export async function fetchImageMeta(page: Page, url: string): Promise<{ status: number; contentType: string }> {
  return page.evaluate(async u => {
    const res = await fetch(u, { method: "GET" });
    return { status: res.status, contentType: res.headers.get("content-type") || "" };
  }, url);
}

/**
 * From the home chooser, click into a book and wait for the song list to render.
 * If the app auto-redirected (single book) this still works because we navigate
 * explicitly when the card isn't present.
 */
export async function chooseBook(page: Page, bookId: string): Promise<void> {
  const cardSelector = bookId === "shl" ? selectors.shlSongbook : selectors.sfogSongbook;
  try {
    await page.waitForSelector(cardSelector, { timeout: 8000 });
    await page.click(cardSelector);
  } catch {
    // Fallback: navigate directly if the chooser didn't show the card.
    await page.goto(bookUrl(bookId), { waitUntil: "domcontentloaded" });
  }
  await page.waitForSelector(selectors.searchViewIonCard, { timeout: 15000 });
}

/**
 * Navigate to a song's lyric view and wait until the LIVE data has loaded.
 *
 * The app uses HashRouter, so navigating between two hash URLs on the same
 * document does NOT trigger a full reload; the title can briefly show the
 * previous song or the "0)" placeholder while the async fetch resolves. We
 * therefore wait for the title to begin with the EXACT expected song number,
 * which is deterministic and immune to that staleness.
 */
export async function gotoSongLyric(page: Page, bookId: string, songNumber: number): Promise<void> {
  await page.goto(songUrl(bookId, songNumber), { waitUntil: "domcontentloaded" });
  await page.waitForSelector(selectors.lyricViewIonCardTitle, { timeout: 15000 });
  await waitForLyricTitleNumber(page, songNumber);
}

/** Wait until the lyric-view title starts with `<songNumber>)`. */
export async function waitForLyricTitleNumber(page: Page, songNumber: number): Promise<void> {
  await page.waitForFunction(
    (sel, n) => {
      const el = document.querySelector(sel as string);
      return !!el && (el.innerHTML || "").startsWith(`${n})`);
    },
    { timeout: 30000 },
    selectors.lyricViewIonCardTitle,
    songNumber
  );
}

/**
 * Toggle from lyric to music view on a song page and wait for the image src to
 * resolve to the expected song's PNG (guards against reading a stale src).
 */
export async function toggleToMusic(page: Page, songNumber?: number): Promise<void> {
  await page.waitForSelector(selectors.songViewToggler);
  await page.click(selectors.songViewToggler);
  await page.waitForSelector(selectors.musicView, { timeout: 15000 });
  if (songNumber !== undefined) {
    await page.waitForFunction(
      (sel, frag) => {
        const el = document.querySelector(sel as string) as HTMLImageElement | null;
        return !!el && (el.getAttribute("src") || "").includes(frag as string);
      },
      { timeout: 15000 },
      selectors.musicView,
      `_${makeThreeDigits(songNumber)}`
    );
  }
}

export { Browser, Page };

/**
 * Installs an in-page fetch shim that intercepts GitHub API calls and returns a
 * fake 201 response, recording each call on `window.__githubCalls`. This MUST be
 * installed via evaluateOnNewDocument BEFORE navigation so the feedback form
 * never creates a real GitHub issue. We patch window.fetch (Octokit uses fetch)
 * rather than puppeteer request-interception, which is racy in puppeteer 5.x
 * against Ionic's many concurrent requests.
 */
export async function installGithubMock(page: Page): Promise<void> {
  await page.evaluateOnNewDocument(() => {
    // @ts-expect-error - test-only global
    window.__githubCalls = [];
    const orig = window.fetch.bind(window);
    window.fetch = function(input: RequestInfo | URL, init?: RequestInit) {
      const url = typeof input === "string" ? input : (input as Request).url || String(input);
      if (url.includes("api.github.com")) {
        // @ts-expect-error - test-only global
        window.__githubCalls.push({ url, method: (init && init.method) || "GET", body: init && init.body });
        return Promise.resolve(
          new Response(JSON.stringify({ html_url: "https://example.test/issues/999", number: 999, body: "mock" }), {
            status: 201,
            headers: { "content-type": "application/json" },
          })
        );
      }
      return orig(input as RequestInfo, init);
    };
  });
}

/** Returns the GitHub API calls recorded by installGithubMock. */
export async function getGithubCalls(page: Page): Promise<Array<{ url: string; method: string; body?: string }>> {
  // @ts-expect-error - test-only global
  return page.evaluate(() => (window as any).__githubCalls || []);
}

/**
 * Opens the Settings modal from the current page (works on book or song pages).
 * The settings gear is the last ion-button in the end slot of the nav toolbar.
 */
export async function openSettings(page: Page): Promise<void> {
  const endButtons = await page.$$("ion-buttons[slot=end] > ion-button");
  if (endButtons.length === 0) throw new Error("No nav end buttons found");
  await endButtons[endButtons.length - 1].click();
  await page.waitForSelector(selectors.settingsModal, { visible: true, timeout: 8000 });
  await page.waitForSelector(selectors.settingsTitle, { timeout: 8000 });
}

/**
 * Drives the infinite scroll by repeatedly hovering the last/near-last cards
 * (mirrors the original suite's approach, which reliably fires IonInfiniteScroll)
 * until either the target count is reached or no further cards load.
 * Returns the final card count.
 */
export async function loadSongsUntil(page: Page, target: number, maxRounds = 200): Promise<number> {
  let cards = await page.$$(selectors.searchViewIonCard);
  let rounds = 0;
  let stalls = 0;
  // Position the mouse over the list so wheel events hit the scroll container.
  const vp = page.viewport();
  const cx = vp ? Math.floor(vp.width / 2) : 400;
  const cy = vp ? Math.floor(vp.height / 2) : 400;
  await page.mouse.move(cx, cy);
  while (cards.length < target && rounds < maxRounds) {
    const prevLen = cards.length;
    // Wheel-scroll down in several increments — this reliably re-arms
    // IonInfiniteScroll (hover-only nudging stalled for SFOG).
    for (let k = 0; k < 6; k++) {
      await page.mouse.wheel({ deltaY: 600 });
      await new Promise(r => setTimeout(r, 80));
    }
    try {
      await page.waitForFunction(
        (sel, n) => document.querySelectorAll(sel as string).length > (n as number),
        { timeout: 4000 },
        selectors.searchViewIonCard,
        prevLen
      );
      stalls = 0;
    } catch {
      // Either exhausted (infinite scroll disabled) or a transient stall.
      const disabled = await page.evaluate(() => {
        const el = document.querySelector("ion-infinite-scroll") as any;
        return el ? !!el.disabled : true;
      });
      if (disabled) break;
      stalls++;
      if (stalls >= 4) break;
    }
    cards = await page.$$(selectors.searchViewIonCard);
    rounds++;
  }
  return cards.length;
}

/**
 * Performs a horizontal swipe on the song page body using CDP touch events.
 * deltaX < 0 swipes left (next song); deltaX > 0 swipes right (prev song).
 */
export async function swipe(page: Page, deltaX: number, y = 400): Promise<void> {
  const cdp = await page.target().createCDPSession();
  const fromX = deltaX < 0 ? 320 : 60;
  const toX = fromX + deltaX;
  await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x: fromX, y }] });
  const steps = 5;
  for (let i = 1; i <= steps; i++) {
    const x = fromX + ((toX - fromX) * i) / steps;
    await cdp.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x, y }] });
    await new Promise(r => setTimeout(r, 8));
  }
  await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
}

/** Small fixed delay helper for the few places we must wait for an animation. */
export function delay(ms: number): Promise<void> {
  return new Promise(r => setTimeout(r, ms));
}

/**
 * Type into a search bar and wait for the debounced (200ms) results to settle.
 * Returns the visible result titles (trimmed).
 */
export async function searchAndGetTitles(page: Page, term: string): Promise<string[]> {
  await page.waitForSelector(selectors.searchBar);
  await page.waitForSelector(selectors.searchViewIonCard, { timeout: 15000 }).catch(() => undefined);
  await page.type(selectors.searchBar, term);
  // Debounce is 200ms; wait a bit longer for the list to re-render.
  await delay(900);
  return page.$$eval(selectors.searchViewIonCardTitle, els => els.map(e => (e.textContent || "").trim()));
}
