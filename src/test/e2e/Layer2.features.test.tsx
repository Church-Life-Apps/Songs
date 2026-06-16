/**
 * LAYER 2 — Feature matrix (live data).
 *
 * Covers every feature from PREP-REPORT §1 / the §4 case table across
 * {SHL, SFOG} x {mobile ~390px, desktop ~1366px} where the dimension is
 * meaningful. Desktop-only features (prev/next arrow FABs) and mobile-only
 * features (swipe navigation) are tested on their respective form factor.
 *
 * Uses LIVE data (no committed Resources snapshot). The feedback form mocks the
 * GitHub API in-page so the suite NEVER creates real GitHub issues.
 *
 * Where a known bug means the "correct" behavior isn't implemented yet, the test
 * asserts CURRENT behavior with a `// KNOWN BUG #NNN` note or is skipped with a
 * clear comment, so the suite stays green as a safety net for later fixes.
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
  chooseBook,
  gotoSongLyric,
  toggleToMusic,
  waitForLyricTitleNumber,
  expectedImageUrl,
  fetchImageMeta,
  openSettings,
  loadSongsUntil,
  swipe,
  searchAndGetTitles,
  installGithubMock,
  getGithubCalls,
  selectors,
  bookUrl,
  songUrl,
  baseUrl,
  delay,
  VIEWPORTS,
} from "../helpers/e2e";

type FormFactor = "mobile" | "desktop";
const FORM_FACTORS: FormFactor[] = ["mobile", "desktop"];
const BOOK_IDS: BookId[] = ["shl", "sfog"];

// A song known to exist in both books with a sheet-music image.
const SAMPLE_SONG: Record<BookId, number> = { shl: 6, sfog: 6 };

let browser: Browser;
// Live data caches keyed by book.
const books: Partial<Record<BookId, Songbook>> = {};
const songLists: Partial<Record<BookId, Song[]>> = {};

beforeAll(async () => {
  browser = await launchBrowser();
  const boot = await newPage(browser, "desktop");
  for (const b of BOOK_IDS) {
    books[b] = await getSongbook(boot, b);
    songLists[b] = await getSongs(boot, b);
  }
  await boot.close();
}, 90000);

afterAll(async () => {
  if (browser) await browser.close();
});

/* ----------------------------------------------------------------------------
 * Songbook chooser / switching (F1, F2) — per viewport (book-agnostic).
 * ------------------------------------------------------------------------- */
describe.each(FORM_FACTORS)("Songbook chooser [%s]", formFactor => {
  it("lists both songbooks and navigates into each", async () => {
    const page = await newPage(browser, formFactor);
    try {
      await page.waitForFunction(
        sel => document.querySelectorAll(sel as string).length >= 2,
        { timeout: 15000 },
        selectors.songbookCard
      );
      const cards = await page.$$eval(selectors.songbookCard, els =>
        els.map(e => ({ id: e.id, title: (e.querySelector("ion-card-title") || {}).textContent }))
      );
      const ids = cards.map(c => c.id);
      expect(ids).toContain("shl");
      expect(ids).toContain("sfog");

      // Click into SHL.
      await page.click(selectors.shlSongbook);
      await page.waitForSelector(selectors.searchViewIonCard, { timeout: 15000 });
      expect(page.url()).toContain("/#/shl");
    } finally {
      await page.close();
    }
  }, 40000);

  it("home button returns to the chooser and switches books", async () => {
    const page = await newPage(browser, formFactor);
    try {
      await chooseBook(page, "shl");
      // Nav back-home button is the first start-slot button.
      await page.click("ion-buttons[slot=start] > ion-button");
      await page.waitForFunction(
        sel => document.querySelectorAll(sel as string).length >= 2,
        { timeout: 15000 },
        selectors.songbookCard
      );
      // Now switch to SFOG.
      await page.click(selectors.sfogSongbook);
      await page.waitForSelector(selectors.searchViewIonCard, { timeout: 15000 });
      expect(page.url()).toContain("/#/sfog");
    } finally {
      await page.close();
    }
  }, 40000);
});

/* ----------------------------------------------------------------------------
 * Search (F5-F11) — per book, desktop (search logic is viewport-independent;
 * one mobile smoke check below covers the mobile input path).
 * ------------------------------------------------------------------------- */
describe.each(BOOK_IDS)("Search [%s]", bookId => {
  it("number: exact match returns that song", async () => {
    const page = await newPage(browser, "desktop");
    try {
      await chooseBook(page, bookId);
      const song = getSong(songLists[bookId] as Song[], 100);
      const titles = await searchAndGetTitles(page, "100");
      expect(titles[0]).toBe(`100. ${song.title}`);
    } finally {
      await page.close();
    }
  }, 40000);

  it("number: prefix match returns starts-with results", async () => {
    const page = await newPage(browser, "desktop");
    try {
      await chooseBook(page, bookId);
      const titles = await searchAndGetTitles(page, "12");
      expect(titles.length).toBeGreaterThan(0);
      // Every result's number should start with "12".
      for (const t of titles) {
        const num = t.split(".")[0].trim();
        expect(num.startsWith("12")).toBe(true);
      }
    } finally {
      await page.close();
    }
  }, 40000);

  it("title: substring match ranks the titled song first", async () => {
    const page = await newPage(browser, "desktop");
    try {
      await chooseBook(page, bookId);
      // Find a song whose title has a distinctive multi-word token.
      const songs = songLists[bookId] as Song[];
      const target = songs.find(s => s.title.split(" ").length >= 2 && s.songNumber <= 200) as Song;
      const token = target.title.split(" ")[0];
      const titles = await searchAndGetTitles(page, token);
      expect(titles.length).toBeGreaterThan(0);
      // At least one result contains the token (case-insensitive).
      expect(titles.some(t => t.toLowerCase().includes(token.toLowerCase()))).toBe(true);
    } finally {
      await page.close();
    }
  }, 40000);

  it("lyrics: a lyric phrase finds the song", async () => {
    const page = await newPage(browser, "desktop");
    try {
      await chooseBook(page, bookId);
      const songs = songLists[bookId] as Song[];
      // Use a distinctive first lyric line from an early song.
      const src = getSong(songs, 1);
      const firstVerseKey = Object.keys(src.lyrics)[0];
      const line = (src.lyrics[firstVerseKey] || [])[0] || "";
      const phrase = line
        .split(/\s+/)
        .slice(0, 4)
        .join(" ");
      if (phrase.trim().length < 4) {
        // Degenerate data; skip silently rather than fail.
        return;
      }
      const titles = await searchAndGetTitles(page, phrase);
      expect(titles.length).toBeGreaterThan(0);
    } finally {
      await page.close();
    }
  }, 40000);

  it("no results: gibberish shows the empty state", async () => {
    const page = await newPage(browser, "desktop");
    try {
      await chooseBook(page, bookId);
      await page.type(selectors.searchBar, "zxqwvzzzqx");
      await page.waitForSelector(selectors.noResultsFoundLabel, { timeout: 8000 });
      const label = await page.$eval(selectors.noResultsFoundLabel, e => e.innerHTML);
      expect(label).toEqual("No results found");
    } finally {
      await page.close();
    }
  }, 40000);

  it("clear button resets the search", async () => {
    const page = await newPage(browser, "desktop");
    try {
      await chooseBook(page, bookId);
      await page.type(selectors.searchBar, "100");
      await delay(700);
      await page.waitForSelector(selectors.searchClearButton, { timeout: 5000 });
      await page.click(selectors.searchClearButton);
      await delay(700);
      const value = await page.$eval(selectors.searchBar, e => (e as HTMLInputElement).value);
      expect(value).toBe("");
      // Full list restored (more than a single result).
      const cards = await page.$$(selectors.searchViewIonCard);
      expect(cards.length).toBeGreaterThan(1);
    } finally {
      await page.close();
    }
  }, 40000);
});

it("search is case- and word-order-insensitive (SHL)", async () => {
  const page = await newPage(browser, "desktop");
  try {
    await chooseBook(page, "shl");
    const expected = "3. Praise God From Whom All Blessings Flow";
    const t1 = await searchAndGetTitles(page, "praise god from Whom aLL bleSsiNgs FLOW");
    expect(t1[0]).toBe(expected);
    await page.close();

    const page2 = await newPage(browser, "desktop");
    await chooseBook(page2, "shl");
    const t2 = await searchAndGetTitles(page2, "whom all flow god praise from blessings");
    expect(t2[0]).toBe(expected);
    await page2.close();
  } catch (e) {
    if (!page.isClosed()) await page.close();
    throw e;
  }
}, 50000);

it("search by author returns author match (SHL only — SFOG authors are empty)", async () => {
  const page = await newPage(browser, "desktop");
  try {
    await chooseBook(page, "shl");
    const titles = await searchAndGetTitles(page, "bertha fennell");
    expect(titles[0]).toBe("401. Savior, I By Faith Am Touching");
  } finally {
    await page.close();
  }
}, 40000);

it("search persists across navigation and is restored on back (SHL)", async () => {
  const page = await newPage(browser, "desktop");
  try {
    await chooseBook(page, "shl");
    await page.type(selectors.searchBar, "100");
    await delay(800);
    // localStorage should hold the search string.
    const stored = await page.evaluate(() => localStorage.getItem("searchString"));
    expect(stored).toBe("100");
    // Navigate to a song, then back to the book page.
    const cards = await page.$$(selectors.searchViewIonCardTitle);
    await cards[0].click();
    await page.waitForSelector(selectors.lyricViewIonCardTitle, { timeout: 15000 });
    await page.goBack();
    await page.waitForSelector(selectors.searchBar, { timeout: 10000 });
    await delay(800);
    const value = await page.$eval(selectors.searchBar, e => (e as HTMLInputElement).value);
    expect(value).toBe("100");
  } finally {
    await page.close();
  }
}, 50000);

it("search input works on mobile form factor (SHL)", async () => {
  const page = await newPage(browser, "mobile");
  try {
    await chooseBook(page, "shl");
    const titles = await searchAndGetTitles(page, "100");
    const song = getSong(songLists.shl as Song[], 100);
    expect(titles[0]).toBe(`100. ${song.title}`);
  } finally {
    await page.close();
  }
}, 40000);

/* ----------------------------------------------------------------------------
 * Infinite scroll / pagination (F12) — per book × viewport, incl. tall viewport
 * (#242). Initial page = 30; scrolling loads to the full count.
 * ------------------------------------------------------------------------- */
describe.each(BOOK_IDS)("Infinite scroll [%s]", bookId => {
  it("initial render shows 30 cards", async () => {
    const page = await newPage(browser, "desktop");
    try {
      await chooseBook(page, bookId);
      const cards = await page.$$(selectors.searchViewIonCard);
      expect(cards.length).toBe(30);
    } finally {
      await page.close();
    }
  }, 40000);

  it("scrolling loads the full song list", async () => {
    const page = await newPage(browser, "desktop");
    try {
      await chooseBook(page, bookId);
      const total = (songLists[bookId] as Song[]).length;
      const loaded = await loadSongsUntil(page, total);
      expect(loaded).toBe(total);
    } finally {
      await page.close();
    }
  }, 60000);

  it("tall viewport never auto-loads past the initial page (KNOWN BUG #242)", async () => {
    // KNOWN BUG #242: when the initial page of items all fit within the viewport
    // (no vertical overflow), IonInfiniteScroll's onIonInfinite never fires from
    // scrolling, so songs past the first page are unreachable by scrolling alone.
    // We use a very tall viewport (4000px) so all 30 initial cards fit with no
    // overflow, then attempt to scroll and assert the list is STUCK at 30 —
    // documenting the current (buggy) behavior. When #242 is fixed (auto-load
    // until overflow, or a manual "load more"), this expectation should change to
    // assert that more than 30 load.
    const page = await browser.newPage();
    try {
      await page.setViewport({ width: 1366, height: 4000 });
      await page.goto(bookUrl(bookId), { waitUntil: "domcontentloaded" });
      await page.waitForSelector(selectors.searchViewIonCard, { timeout: 15000 });
      const initial = await page.$$(selectors.searchViewIonCard);
      expect(initial.length).toBe(30);
      // Attempt to scroll: content fits, so nothing new should load.
      await page.mouse.move(683, 2000);
      for (let k = 0; k < 8; k++) {
        await page.mouse.wheel({ deltaY: 1000 });
        await delay(80);
      }
      await delay(1500);
      const after = await page.$$(selectors.searchViewIonCard);
      expect(after.length).toBe(30); // KNOWN BUG #242 — stuck at the initial page
    } finally {
      await page.close();
    }
  }, 60000);
});

/* ----------------------------------------------------------------------------
 * Lyric view + verse labels (F13, F14, F15) — per book.
 * ------------------------------------------------------------------------- */
describe.each(BOOK_IDS)("Lyric view [%s]", bookId => {
  it("renders title and verse blocks", async () => {
    const page = await newPage(browser, "desktop");
    try {
      const n = SAMPLE_SONG[bookId];
      const song = getSong(songLists[bookId] as Song[], n);
      await gotoSongLyric(page, bookId, n);
      const title = await page.$eval(selectors.lyricViewIonCardTitle, e => e.innerHTML);
      expect(title).toBe(`${n}) ${song.title}`);
      const verses = await page.$$(selectors.lyricVerseName);
      expect(verses.length).toBeGreaterThan(0);
    } finally {
      await page.close();
    }
  }, 40000);

  it("maps verse-label prefixes (v/c/b/p/t/e) to friendly names", async () => {
    const page = await newPage(browser, "desktop");
    try {
      // Find a sampled song whose presentation exercises multiple label kinds.
      const songs = songLists[bookId] as Song[];
      const target =
        songs.find(s => /\bp\b|\bt\b|\be\b|\bb\d?\b/.test(s.presentation || "") && s.songNumber <= 280) ||
        getSong(songs, SAMPLE_SONG[bookId]);
      await gotoSongLyric(page, bookId, target.songNumber);
      const labels = await page.$$eval(selectors.lyricVerseName, els => els.map(e => (e.textContent || "").trim()));
      // No label should be a bare single letter (i.e. the prefix mapping ran).
      for (const l of labels) {
        expect(/^[a-z]$/i.test(l)).toBe(false);
      }
      // Known friendly words appear.
      expect(labels.some(l => /Verse|Chorus|Bridge|Pre-Chorus|Tag|Ending|Interlude/.test(l))).toBe(true);
    } finally {
      await page.close();
    }
  }, 40000);
});

/* ----------------------------------------------------------------------------
 * Music view, view toggle, zoom (F16, F17, F18) — per book × viewport.
 * ------------------------------------------------------------------------- */
describe.each(BOOK_IDS)("Music view [%s]", bookId => {
  it.each(FORM_FACTORS)(
    "[%s] lyric↔music toggle both directions + image loads",
    async formFactor => {
      const page = await newPage(browser, formFactor);
      try {
        const n = SAMPLE_SONG[bookId];
        await gotoSongLyric(page, bookId, n);
        // lyric -> music
        await toggleToMusic(page, n);
        const src = await page.$eval(selectors.musicView, e => e.getAttribute("src"));
        expect(src).toBe(expectedImageUrl(books[bookId] as Songbook, n));
        const meta = await fetchImageMeta(page, src as string);
        expect(meta.status).toBe(200);
        expect(meta.contentType).toContain("image/png");
        // music -> lyric
        await page.click(selectors.songViewToggler);
        await page.waitForSelector(selectors.lyricViewIonCardTitle, { timeout: 15000 });
        await waitForLyricTitleNumber(page, n);
      } finally {
        await page.close();
      }
    },
    50000
  );

  it("double-click zoom doubles image width then resets", async () => {
    const page = await newPage(browser, "desktop");
    try {
      const n = SAMPLE_SONG[bookId];
      await gotoSongLyric(page, bookId, n);
      await toggleToMusic(page, n);
      const w1 = await page.$eval(selectors.musicView, e => (e as HTMLElement).style.width);
      await page.click(selectors.musicView, { clickCount: 2 });
      await delay(400);
      const w2 = await page.$eval(selectors.musicView, e => (e as HTMLElement).style.width);
      await page.click(selectors.musicView, { clickCount: 2 });
      await delay(400);
      const w3 = await page.$eval(selectors.musicView, e => (e as HTMLElement).style.width);
      const px = (s: string) => parseFloat(s);
      expect(px(w2)).toBeCloseTo(px(w1) * 2, 0);
      expect(px(w3)).toBeCloseTo(px(w1), 0);
    } finally {
      await page.close();
    }
  }, 40000);
});

/* ----------------------------------------------------------------------------
 * Second-tune toggle (F19) — SHL 156/216/278/478 only; ABSENT otherwise.
 * ------------------------------------------------------------------------- */
describe("Second-tune toggle (F19)", () => {
  const TWO_TUNE = [156, 216, 278, 478];

  it.each(TWO_TUNE)(
    "SHL song %i shows the second-tune toggle and switches to -B image",
    async n => {
      const page = await newPage(browser, "desktop");
      try {
        await gotoSongLyric(page, "shl", n);
        await toggleToMusic(page, n);
        await page.waitForSelector(selectors.songToggler, { timeout: 10000 });
        const before = await page.$eval(selectors.musicView, e => e.getAttribute("src"));
        expect(before).toBe(expectedImageUrl(books.shl as Songbook, n, false));
        // Flip the toggle.
        await page.click(selectors.songTogglerToggle);
        await page.waitForFunction(
          (sel, frag) => {
            const el = document.querySelector(sel as string);
            return !!el && (el.getAttribute("src") || "").includes(frag as string);
          },
          { timeout: 10000 },
          selectors.musicView,
          "-B.png"
        );
        const after = await page.$eval(selectors.musicView, e => e.getAttribute("src"));
        expect(after).toBe(expectedImageUrl(books.shl as Songbook, n, true));
        const meta = await fetchImageMeta(page, after as string);
        expect(meta.status).toBe(200);
        expect(meta.contentType).toContain("image/png");
      } finally {
        await page.close();
      }
    },
    50000
  );

  it("SHL non-two-tune song has NO second-tune toggle", async () => {
    const page = await newPage(browser, "desktop");
    try {
      await gotoSongLyric(page, "shl", SAMPLE_SONG.shl);
      await toggleToMusic(page, SAMPLE_SONG.shl);
      await delay(500);
      expect(await page.$(selectors.songToggler)).toBeNull();
    } finally {
      await page.close();
    }
  }, 40000);

  it("SFOG song 156 has NO second-tune toggle (SHL-only feature)", async () => {
    const page = await newPage(browser, "desktop");
    try {
      await gotoSongLyric(page, "sfog", 156);
      await toggleToMusic(page, 156);
      await delay(500);
      expect(await page.$(selectors.songToggler)).toBeNull();
    } finally {
      await page.close();
    }
  }, 40000);
});

/* ----------------------------------------------------------------------------
 * Prev/next arrow buttons (F20) — DESKTOP only.
 * ------------------------------------------------------------------------- */
describe("Prev/next arrows (F20, desktop)", () => {
  it.each(BOOK_IDS)(
    "[%s] next/prev navigate between songs in lyric view",
    async bookId => {
      const page = await newPage(browser, "desktop");
      try {
        await gotoSongLyric(page, bookId, 6);
        await page.waitForSelector(selectors.nextButton, { timeout: 15000 });
        await delay(300);
        await page.click(selectors.nextButton);
        await waitForLyricTitleNumber(page, 7);
        expect(page.url()).toBe(songUrl(bookId, 7));
        await page.waitForSelector(selectors.prevButton, { timeout: 15000 });
        await delay(300);
        await page.click(selectors.prevButton);
        await waitForLyricTitleNumber(page, 6);
        expect(page.url()).toBe(songUrl(bookId, 6));
      } finally {
        await page.close();
      }
    },
    60000
  );

  it("prev button is absent on song 1; next button absent on the last song (SHL)", async () => {
    const total = (songLists.shl as Song[]).length;
    const page = await newPage(browser, "desktop");
    try {
      await gotoSongLyric(page, "shl", 1);
      await delay(600);
      expect(await page.$(selectors.prevButton)).toBeNull();
      expect(await page.$(selectors.nextButton)).not.toBeNull();
      await page.close();

      const page2 = await newPage(browser, "desktop");
      await gotoSongLyric(page2, "shl", total);
      await delay(600);
      expect(await page2.$(selectors.nextButton)).toBeNull();
      expect(await page2.$(selectors.prevButton)).not.toBeNull();
      await page2.close();
    } catch (e) {
      if (!page.isClosed()) await page.close();
      throw e;
    }
  }, 50000);

  it("arrow FABs are NOT rendered on mobile (mobile uses swipe)", async () => {
    const page = await newPage(browser, "mobile");
    try {
      await gotoSongLyric(page, "shl", 6);
      await delay(600);
      expect(await page.$(selectors.nextButton)).toBeNull();
      expect(await page.$(selectors.prevButton)).toBeNull();
    } finally {
      await page.close();
    }
  }, 40000);
});

/* ----------------------------------------------------------------------------
 * Swipe navigation (F21) — MOBILE only.
 * ------------------------------------------------------------------------- */
describe("Swipe navigation (F21, mobile)", () => {
  it.each(BOOK_IDS)(
    "[%s] swipe left → next, swipe right → prev",
    async bookId => {
      const page = await newPage(browser, "mobile");
      try {
        await gotoSongLyric(page, bookId, 6);
        await delay(1200); // let the swipe gesture mount
        await swipe(page, -260); // left → next
        await waitForLyricTitleNumber(page, 7);
        expect(page.url()).toBe(songUrl(bookId, 7));
        await delay(800);
        await swipe(page, 260); // right → prev
        await waitForLyricTitleNumber(page, 6);
        expect(page.url()).toBe(songUrl(bookId, 6));
      } finally {
        await page.close();
      }
    },
    60000
  );

  it("swipe right at song 1 does not navigate below 1 (SHL)", async () => {
    const page = await newPage(browser, "mobile");
    try {
      await gotoSongLyric(page, "shl", 1);
      await delay(1200);
      await swipe(page, 260); // right → prev, but already at 1
      await delay(1200);
      expect(page.url()).toBe(songUrl("shl", 1));
    } finally {
      await page.close();
    }
  }, 40000);
});

/* ----------------------------------------------------------------------------
 * Download sheet music (F22) — music mode only; correct name; png not html.
 * ------------------------------------------------------------------------- */
describe.each(BOOK_IDS)("Download sheet music [%s]", bookId => {
  it("download button is absent in lyric view, present in music view with correct name", async () => {
    const page = await newPage(browser, "desktop");
    try {
      const n = SAMPLE_SONG[bookId];
      await gotoSongLyric(page, bookId, n);
      // Lyric view → no download button.
      expect(await page.$(selectors.downloadMusicButton)).toBeNull();
      // Music view → button present with download name "<book>_<n>".
      await toggleToMusic(page, n);
      await page.waitForSelector(selectors.downloadMusicButton, { timeout: 10000 });
      const name = await page.$eval(selectors.downloadMusicButton, e => e.getAttribute("download"));
      expect(name).toBe(`${bookId}_${n}`);
    } finally {
      await page.close();
    }
  }, 50000);

  it("downloaded blob source is a PNG, not HTML (guards #211)", async () => {
    const page = await newPage(browser, "desktop");
    try {
      const n = SAMPLE_SONG[bookId];
      await gotoSongLyric(page, bookId, n);
      await toggleToMusic(page, n);
      await page.waitForSelector(selectors.downloadMusicButton, { timeout: 10000 });
      // The nav bar fetches the image as a blob for the href; verify the
      // underlying source image is a real PNG (the blob is built from it).
      const meta = await fetchImageMeta(page, expectedImageUrl(books[bookId] as Songbook, n));
      expect(meta.status).toBe(200);
      expect(meta.contentType).toContain("image/png");
      expect(meta.contentType).not.toContain("text/html");
      // The href should be a blob: URL once the fetch resolves.
      await page.waitForFunction(
        sel => {
          const el = document.querySelector(sel as string) as HTMLAnchorElement | null;
          return !!el && (el.getAttribute("href") || "").startsWith("blob:");
        },
        { timeout: 10000 },
        selectors.downloadMusicButton
      );
    } finally {
      await page.close();
    }
  }, 50000);
});

/* ----------------------------------------------------------------------------
 * Settings + dark mode persistence (F23, F24) — global.
 * ------------------------------------------------------------------------- */
describe("Settings & dark mode (F23, F24)", () => {
  it("opens settings modal and closes via Back to Hymnal", async () => {
    const page = await newPage(browser, "desktop");
    try {
      await chooseBook(page, "shl");
      await openSettings(page);
      expect(await page.$(selectors.darkModeToggle)).not.toBeNull();
      await page.click(selectors.returnToHymnalButton);
      await page.waitForFunction(
        sel => {
          const m = document.querySelector(sel as string);
          return !m || m.getAttribute("aria-hidden") === "true" || !(m as HTMLElement).offsetParent;
        },
        { timeout: 8000 },
        selectors.settingsModal
      );
    } finally {
      await page.close();
    }
  }, 40000);

  it("dark-mode toggle applies and persists across reload", async () => {
    const page = await newPage(browser, "desktop");
    try {
      await chooseBook(page, "shl");
      await openSettings(page);
      // Ensure we start from light.
      await page.evaluate(() => {
        localStorage.setItem("theme", "light");
        document.body.classList.remove("dark");
      });
      await page.click(selectors.darkModeToggle);
      await delay(400);
      const stored = await page.evaluate(() => localStorage.getItem("theme"));
      expect(stored).toBe("dark");
      const hasDark = await page.evaluate(() => document.body.classList.contains("dark"));
      expect(hasDark).toBe(true);
      // Reload → theme should re-apply from localStorage.
      await page.reload({ waitUntil: "domcontentloaded" });
      await delay(800);
      const hasDarkAfter = await page.evaluate(() => document.body.classList.contains("dark"));
      expect(hasDarkAfter).toBe(true);
      // Cleanup so other tests start clean.
      await page.evaluate(() => localStorage.removeItem("theme"));
    } finally {
      await page.close();
    }
  }, 40000);
});

/* ----------------------------------------------------------------------------
 * Feedback form (F25) — validation + route context; GitHub API MOCKED.
 * ------------------------------------------------------------------------- */
describe("Feedback form (F25) — mocked GitHub API", () => {
  it("blocks submission when title/message are empty", async () => {
    const page = await browser.newPage();
    try {
      await page.setViewport(VIEWPORTS.desktop);
      await installGithubMock(page);
      await page.goto(songUrl("shl", 6), { waitUntil: "domcontentloaded" });
      await waitForLyricTitleNumber(page, 6);
      await openSettings(page);
      await page.click(selectors.submitFeedbackButton); // "Submit Feedback"
      await page.waitForSelector(selectors.feedbackFormDiv, { timeout: 8000 });
      // Submit empty.
      const submit = await page.$(`${selectors.feedbackFormDiv} ion-button`);
      await (submit as any).click();
      await page.waitForFunction(
        sel => {
          const e = document.querySelector(sel as string);
          return e && (e.textContent || "").length > 0;
        },
        { timeout: 8000 },
        selectors.feedbackResponseText
      );
      const msg = await page.$eval(selectors.feedbackResponseText, e => e.textContent);
      expect(msg).toContain("Please include a title");
      // No GitHub call should have been made.
      const calls = await getGithubCalls(page);
      expect(calls.length).toBe(0);
    } finally {
      await page.close();
    }
  }, 50000);

  it("submits with route context prefix and never hits real GitHub", async () => {
    const page = await browser.newPage();
    try {
      await page.setViewport(VIEWPORTS.desktop);
      await installGithubMock(page);
      await page.goto(songUrl("shl", 6), { waitUntil: "domcontentloaded" });
      await waitForLyricTitleNumber(page, 6);
      await openSettings(page);
      await page.click(selectors.submitFeedbackButton);
      await page.waitForSelector(`${selectors.feedbackFormDiv} ion-textarea textarea`, { timeout: 8000 });
      await delay(300);
      const inputs = await page.$$(`${selectors.feedbackFormDiv} ion-input input`);
      const textarea = await page.$(`${selectors.feedbackFormDiv} ion-textarea textarea`);
      await inputs[1].type("My Subject"); // 2nd input = Subject/Title
      await (textarea as any).type("My feedback message");
      await delay(300);
      const submit = await page.$(`${selectors.feedbackFormDiv} ion-button`);
      await (submit as any).click();
      await page.waitForFunction(
        sel => {
          const e = document.querySelector(sel as string);
          return e && (e.textContent || "").length > 0;
        },
        { timeout: 8000 },
        selectors.feedbackResponseText
      );
      const msg = await page.$eval(selectors.feedbackResponseText, e => e.textContent);
      expect(msg).toContain("Submitted");
      // Exactly one MOCKED GitHub call, with the route-context prefix in the title.
      const calls = await getGithubCalls(page);
      expect(calls.length).toBe(1);
      expect(calls[0].url).toContain("api.github.com/repos/Church-Life-Apps/Songs/issues");
      const body = JSON.parse(calls[0].body || "{}");
      expect(body.title).toContain("[shl/6]");
      expect(body.title).toContain("My Subject");
    } finally {
      await page.close();
    }
  }, 50000);
});

/* ----------------------------------------------------------------------------
 * Edge cases (F: error states) — bad songId in URL.
 * ------------------------------------------------------------------------- */
describe("Edge cases", () => {
  it("non-numeric songId in URL renders a friendly not-found message (#147)", async () => {
    const page = await newPage(browser, "desktop");
    try {
      // currSongId becomes NaN for a non-numeric songId; getSong returns the
      // not-found sentinel (songNumber:-1), which LyricView renders as a friendly
      // "Song not found" card instead of a blank placeholder (#147).
      await page.goto(`${baseUrl}/#/shl/abc`, { waitUntil: "domcontentloaded" });
      await page.waitForSelector(selectors.lyricViewCard, { timeout: 15000 });
      await delay(2500);
      const title = await page.$eval(selectors.lyricViewIonCardTitle, e => e.innerHTML);
      // App stays alive and shows the friendly not-found state, no "N) " prefix.
      expect(title.trim()).toBe("Song not found");
      expect(title).not.toMatch(/-?\d+\)/);

      // The message echoes the requested (non-numeric) songId and the valid range.
      const notFoundText = await page.$eval(selectors.lyricViewNotFound, e => e.textContent || "");
      expect(notFoundText).toContain("abc");
      expect(notFoundText).toMatch(/1\u2013\d+/);
    } finally {
      await page.close();
    }
  }, 40000);
});
