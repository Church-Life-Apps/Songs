/**
 * LAYER 1 — Sampled data checks (live data).
 *
 * For a curated, representative sample of songs per book (NOT all 813), assert:
 *  - Lyric view renders: title `<n>) <title>` + at least one lyric line; author
 *    subtitle shown iff the song's author is non-empty.
 *  - Music view image loads: HTTP 200 with content-type image/png (NOT html) —
 *    this guards issue #211 (blob/download sometimes returning HTML).
 *  - Presentation-order songs render their verses in the declared order.
 *  - Out-of-range edges (0 and N+1) document current behavior (issue #147).
 *
 * Uses LIVE data fetched at runtime from Church-Life-Apps/Resources — no snapshot
 * of Resources is committed to this repo. Titles/authors/presentation are read
 * from the same live JSON the app consumes, so assertions stay in sync with data.
 */
import {
  Browser,
  BookId,
  Song,
  Songbook,
  launchBrowser,
  newPage,
  getSongbook,
  getSongs,
  getSong,
  gotoSongLyric,
  toggleToMusic,
  expectedPresentationLabels,
  expectedImageUrl,
  fetchImageMeta,
  selectors,
  songUrl,
  delay,
} from "../helpers/e2e";

// Curated representative samples (~15-20 per book): first, last, mids,
// presentation-order songs (SHL 42 & 44), and the SHL second-tune songs
// (156/216/278/478). SFOG mirrors the spread within its 280-song range.
const SAMPLES: Record<BookId, number[]> = {
  shl: [1, 6, 42, 44, 100, 156, 216, 250, 278, 333, 400, 478, 500, 533],
  sfog: [1, 42, 44, 88, 100, 156, 200, 216, 250, 278, 280],
};

// Out-of-range edges are derived per book from the live data at runtime
// (low edge 0, high edge max(songNumber) + 1) so they never need hand-updating
// when a songbook grows. See the out-of-range test below.

const PER_SONG_TIMEOUT = 30000;

describe.each<BookId>(["shl", "sfog"])("Layer 1 — %s sampled data", bookId => {
  let browser: Browser;
  let book: Songbook;
  let songs: Song[];

  beforeAll(async () => {
    browser = await launchBrowser();
    // Bootstrap live data via a throwaway page.
    const boot = await newPage(browser, "desktop");
    book = await getSongbook(boot, bookId);
    songs = await getSongs(boot, bookId);
    await boot.close();
  }, 60000);

  afterAll(async () => {
    if (browser) await browser.close();
  });

  it.each(SAMPLES[bookId])(
    "song %i: lyric view renders title, lyrics, and author-iff-present",
    async songNumber => {
      const page = await newPage(browser, "desktop");
      try {
        const expected = getSong(songs, songNumber);
        await gotoSongLyric(page, bookId, songNumber);

        // Title = "<n>) <title>"
        const title = await page.$eval(selectors.lyricViewIonCardTitle, e => e.innerHTML);
        expect(title).toEqual(`${songNumber}) ${expected.title}`);

        // At least one lyric line.
        const lines = await page.$$(selectors.lyricLine);
        expect(lines.length).toBeGreaterThan(0);

        // Author shown iff non-empty (SHL has authors; SFOG authors are all empty).
        const authorEl = await page.$(selectors.lyricViewAuthor);
        const hasAuthor = expected.author != null && expected.author.trim() !== "";
        if (hasAuthor) {
          expect(authorEl).not.toBeNull();
          const authorText = await page.$eval(selectors.lyricViewAuthor, e => e.textContent || "");
          expect(authorText).toContain(expected.author.trim());
        } else {
          expect(authorEl).toBeNull();
        }
      } finally {
        await page.close();
      }
    },
    PER_SONG_TIMEOUT
  );

  it.each(SAMPLES[bookId])(
    "song %i: music image loads HTTP 200 image/png (guards #211)",
    async songNumber => {
      const page = await newPage(browser, "desktop");
      try {
        await gotoSongLyric(page, bookId, songNumber);
        await toggleToMusic(page, songNumber);

        const src = await page.$eval(selectors.musicView, e => e.getAttribute("src"));
        expect(src).toEqual(expectedImageUrl(book, songNumber));

        const meta = await fetchImageMeta(page, src as string);
        expect(meta.status).toBe(200);
        // Must be a real PNG, not an HTML error page.
        expect(meta.contentType).toContain("image/png");
        expect(meta.contentType).not.toContain("text/html");
      } finally {
        await page.close();
      }
    },
    PER_SONG_TIMEOUT
  );

  it("presentation-order songs render verses in the declared order", async () => {
    // Pick sampled songs that declare a presentation string.
    const presSongs = SAMPLES[bookId]
      .map(n => getSong(songs, n))
      .filter(s => s.presentation && s.presentation.trim().length > 0)
      .slice(0, 6);

    expect(presSongs.length).toBeGreaterThan(0);

    for (const song of presSongs) {
      const page = await newPage(browser, "desktop");
      try {
        await gotoSongLyric(page, bookId, song.songNumber);
        const verseNames = await page.$$eval(selectors.lyricVerseName, els =>
          els.map(e => (e.textContent || "").trim())
        );
        expect(verseNames).toEqual(expectedPresentationLabels(song.presentation));
      } finally {
        await page.close();
      }
    }
  }, 90000);

  it("out-of-range song numbers (0 and N+1) document current behavior (#147)", async () => {
    // Derive the high edge from live data: one past the largest real song number.
    const maxSongNumber = songs.reduce((m, s) => Math.max(m, s.songNumber), 0);
    const edges = [0, maxSongNumber + 1];
    for (const edge of edges) {
      const page = await newPage(browser, "desktop");
      try {
        await page.goto(songUrl(bookId, edge), { waitUntil: "domcontentloaded" });
        await page.waitForSelector(selectors.lyricViewIonCardTitle, { timeout: 15000 });
        // Allow the async getSong() to resolve.
        await delay(2500);
        const title = await page.$eval(selectors.lyricViewIonCardTitle, e => e.innerHTML);

        // KNOWN BUG #147: out-of-range numbers render a blank song card instead of
        // a friendly "Song not found" message. getSong() returns songNumber:-1 for
        // numbers > N (rendered as "-1) "), and leaves the "0) " placeholder for 0.
        // We assert the CURRENT (buggy) behavior so the suite stays green; when #147
        // is fixed, this expectation should be updated to the friendly state.
        expect(title === "0) " || title === "-1) " || title.startsWith("-1)") || title.startsWith("0)")).toBe(true);

        // Author row should be absent for the blank placeholder song.
        const authorEl = await page.$(selectors.lyricViewAuthor);
        expect(authorEl).toBeNull();
      } finally {
        await page.close();
      }
    }
  }, 60000);
});
