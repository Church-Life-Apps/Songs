import puppeteer, { Browser, Page } from "puppeteer";
import { defaultNavigationTitle } from "../components/NavigationBar";
import { exception } from "console";

const baseUrl = "http://localhost:8080";
const selectors = {
  searchBar: "#searchBar > input",
  appName: "#appName",
  shlSongbook: "#shl > ion-card-title",
  searchViewIonCard: "#searchViewSongList > ion-card",
  searchViewIonCardTitle: "#searchViewSongList > ion-card > ion-card-title",
  lyricViewIonCardTitle: "#lyricViewCard > ion-card-header > ion-card-title",
  musicView: "#musicView",
  songViewToggler: "#songViewToggler",
  lyricLine: "#lyricViewCard > ion-card-content > ion-text",
  noResultsFoundLabel: "#root > div > ion-content > ion-item > ion-label",
};

describe("App", () => {
  let page: Page;
  let browser: Browser;

  beforeAll(async () => {
    browser = await puppeteer.launch({
      // headless: false, // uncomment this to open browser window for tests
      slowMo: 10, // use this to slow down testing for debugging purposes
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });
  });

  beforeEach(async () => {
    page = await browser.newPage();
    await page.goto(baseUrl);
  });

  it("renders without crashing", async () => {
    await page.waitForSelector(selectors.appName);

    const html = await page.$eval(selectors.appName, (e) => e.innerHTML);
    expect(html).toBe(defaultNavigationTitle);
  });

  it("this test helps prevent later tests from failing", () => {
    true;
  });

  it("searching song number displays correct song", async () => {
    await verifySearchResults(page, "533", ["533. O Church Arise"]);
  });

  it("searching title displays correct results", async () => {
    await verifySearchResults(page, "follow", ["271. Follow On!", "274. How Shall I Follow Him I Serve?"], false);
  });

  it("searching author displays correct results", async () => {
    await verifySearchResults(page, "bertha fennell", ["401. Savior, I By Faith Am Touching"], false);
  });

  it("searching is case and order insensitive", async () => {
    const expectedSong = "3. Praise God From Whom All Blessings Flow";
    const newPage = async () => {
      page = await browser.newPage();
      await page.goto(baseUrl);
    };

    await verifySearchResults(page, "praise god from Whom aLL bleSsiNgs FLOW", [expectedSong], false);

    await newPage();
    await verifySearchResults(page, "whom all flow god praise from blessings", [expectedSong], false);
  }, 10000);

  it("finds song by lyrics", async () => {
    await verifySearchResults(page, "early in the morning", ["5. Holy, Holy, Holy!"], false);
  });

  it("finds song by lyrics", async () => {
    await verifySearchResults(page, "incarnate born", ["77. Crown Him With Many Crowns"], false);
  });

  it("prioritizes title over lyrics in search", async () => {
    await verifySearchResults(page, "incarnate", ["380. O Word Of God Incarnate"], false);
  });

  it("prioritizes title over lyrics in search", async () => {
    await verifySearchResults(page, "born", ["475. Ye Must Be Born Again"], false);
  });

  it("searching terms not found displays no results", async () => {
    await verifySearchResults(page, "zxcvzxv", []);

    expect(await page.$eval(selectors.noResultsFoundLabel, (e) => e.innerHTML)).toEqual("No results found");
  });

  it("selecting song displays song page music view", async () => {
    await page.waitForSelector(selectors.shlSongbook);
    await page.click(selectors.shlSongbook);

    await page.waitForSelector(selectors.searchViewIonCardTitle);

    const navigation = page.waitForNavigation({ waitUntil: "networkidle0" });

    const ionCards = await page.$$(selectors.searchViewIonCardTitle);
    await ionCards[5].click();

    await page.waitForSelector(selectors.songViewToggler);
    const button = await page.$(selectors.songViewToggler);
    await button?.click();

    await page.waitForSelector(selectors.musicView);

    await navigation;

    expect(page.url()).toEqual(baseUrl + "/#/shl/6");
    const musicViewSrc = await page.$eval(selectors.musicView, (e) => e.getAttribute("src"));
    expect(musicViewSrc).toEqual(
      "https://raw.githubusercontent.com/Church-Life-Apps/Resources/master/resources/images/shl/SHL_006.png"
    );
  }, 20000);

  it("song page lyric view works correctly", async () => {
    await page.waitForSelector(selectors.shlSongbook);
    await page.click(selectors.shlSongbook);

    await page.waitForSelector(selectors.searchViewIonCardTitle);

    const ionCards = await page.$$(selectors.searchViewIonCardTitle);
    await ionCards[5].click();

    await page.waitForSelector(selectors.lyricViewIonCardTitle);

    const cardTitle = await page.$eval(selectors.lyricViewIonCardTitle, (e) => e.innerHTML);
    expect(cardTitle).toEqual("Come, Thou Almighty King");

    const lyricLines = await page.$$(selectors.lyricLine);
    expect(lyricLines.length).toEqual(27);
  });

  it("displays song list and loads all songs on scroll", async () => {
    await page.waitForSelector(selectors.shlSongbook);
    await page.click(selectors.shlSongbook);

    await page.waitForSelector(selectors.searchViewIonCard);

    let ionCards = await page.$$(selectors.searchViewIonCard);
    expect(ionCards.length).toBe(20); // list should only pre-load 20 songs.

    // scroll to bottom
    await ionCards[ionCards.length - 1].hover();
    await page.waitForSelector(selectors.searchViewIonCard + `:nth-child(${ionCards.length})`);
    ionCards = await page.$$(selectors.searchViewIonCard);

    while (ionCards.length < 533) {
      // fake scrolling by hovering back and forth:
      await ionCards[ionCards.length - 1].hover();
      await ionCards[ionCards.length - 10].hover();
      await ionCards[ionCards.length - 1].hover();

      await page.waitForSelector(selectors.searchViewIonCard + `:nth-child(${ionCards.length})`);
      ionCards = await page.$$(selectors.searchViewIonCard);
    }

    const loadedIonCards = await page.$$(selectors.searchViewIonCard);
    expect(loadedIonCards.length).toBe(533); // list should contain all 533 songs.
  }, 20000);

  afterAll(async () => {
    browser.close();
  });
});

/**
 * Waits for the SearchBar and song cards to show up.
 * Types in the requested searchTerm.
 * Waits for the 20th original song card to disappear.
 * Asserts that the visible song cards match the songResults.
 * If strict = true, then the visible song cards must exactly be the expected songResults.
 * If strict = false, then only the top N song cards must match the given songResults, where N = songResults.length.
 */
async function verifySearchResults(page: Page, searchTerm: string, songResults: string[], strict = true) {
  await page.waitForSelector(selectors.shlSongbook);
  await page.click(selectors.shlSongbook);

  if (songResults !== null && songResults.length >= 20) {
    throw exception("verifySearchResults only works if songResults < 20 items.");
  }
  await page.waitForSelector(selectors.searchBar);

  await page.waitForSelector(selectors.searchViewIonCard);

  await page.type(selectors.searchBar, searchTerm);

  await page.waitForSelector(selectors.searchViewIonCard + ":nth-child(20)", {
    hidden: true,
  });
  const ionCards = await page.$$(selectors.searchViewIonCardTitle);
  if (strict) {
    expect(ionCards.length).toEqual(songResults.length);
  } else {
    expect(ionCards.length).toBeGreaterThanOrEqual(songResults.length);
  }
  if (strict) {
    for (let i = 0; i < ionCards.length; i++) {
      expect(await ionCards[i].evaluate((e) => e.innerHTML)).toEqual(songResults[i]);
    }
  } else {
    for (let i = 0; i < songResults.length; i++) {
      expect(await ionCards[i].evaluate((e) => e.innerHTML)).toEqual(songResults[i]);
    }
  }
}
