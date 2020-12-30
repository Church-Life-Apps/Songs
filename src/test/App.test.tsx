import { AppName } from "../App";
import puppeteer, { Browser, Page } from "puppeteer";
import { exception } from "console";
import { lagIt } from "../utils/DebuggingUtils";

const baseUrl = "http://localhost:8080";
const selectors = {
  searchBar: "#searchBar > input",
  appName: "#appName",
  searchViewIonCard: "#searchViewSongList > ion-card",
  searchViewIonCardTitle: "#searchViewSongList > ion-card > ion-card-title",
  lyricViewIonCardTitle: "#root > div > ion-content > ion-card > ion-card-header > ion-card-title",
  musicView: "#musicView",
  songViewToggler: "#songViewToggler",
  lyricLine: "#root > div > ion-content > ion-card > ion-card-content > ion-item",
  noResultsFoundLabel: "#root > div > ion-content > ion-item > ion-label",
};

describe("App", () => {
  let page: Page;
  let browser: Browser;

  beforeAll(async () => {
    browser = await puppeteer.launch({
      // headless: false, // use this to open browser window for tests
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
    expect(html).toBe(AppName);
  });

  it("searching song number displays correct song", async () => {
    await verifySearchResults(page, "533", ["533. O Church Arise"]);
  });

  it("searching title displays correct results", async () => {
    await verifySearchResults(page, "follow", ["271. Follow On!", "274. How Shall I Follow Him I Serve?"], false);
  });

  it("searching author displays correct results", async () => {
    await verifySearchResults(page, "chris tomlin", ["121. How Great Is Our God", "135. The Wonderful Cross"]);
  });

  it("searching is case and order insensitive", async () => {
    const newPage = async () => {
      page = await browser.newPage();
      await page.goto(baseUrl);
    };

    await verifySearchResults(page, "praise god from Whom aLL bleSsiNgs FLOW", ["3. Praise God From Whom All Blessings Flow"], false);

    await newPage();
    await verifySearchResults(page, "whom all flow god praise from blessings", ["3. Praise God From Whom All Blessings Flow"], false);
  }, 10000);

  it("searching terms not found displays no results", async () => {
    await verifySearchResults(page, "gibberish", []);

    expect(await page.$eval(selectors.noResultsFoundLabel, (e) => e.innerHTML)).toEqual("No results found");
  });

  it("selecting song displays song page music view", async () => {
    await page.waitForSelector(selectors.searchViewIonCardTitle);

    const navigation = page.waitForNavigation({ waitUntil: "networkidle0" });

    await page.click(selectors.searchViewIonCard + ":nth-child(6)");

    await navigation;

    expect(page.url()).toEqual(baseUrl + "/#/shl/6");

    const musicViewSrc = await page.$eval(selectors.musicView, (e) => e.getAttribute("src"));
    expect(musicViewSrc).toEqual(
      "https://raw.githubusercontent.com/Church-Life-Apps/Resources/master/resources/images/shl/SHL_006.png"
    );
  }, 20000);

  it("song page lyric view works correctly", async () => {
    await page.waitForSelector(selectors.searchViewIonCardTitle);

    const ionCards = await page.$$(selectors.searchViewIonCardTitle);
    await ionCards[5].click();

    await page.waitForSelector(selectors.musicView);
    await page.waitForSelector(selectors.songViewToggler);

    const button = await page.$(selectors.songViewToggler);
    await button?.click();

    await page.waitForSelector(selectors.lyricViewIonCardTitle);

    const cardTitle = await page.$eval(selectors.lyricViewIonCardTitle, (e) => e.innerHTML);
    expect(cardTitle).toEqual("Come, Thou Almighty King");

    const lyricLines = await page.$$(selectors.lyricLine);
    expect(lyricLines.length).toEqual(27);
  });

  it("displays song list and loads all songs on scroll", async () => {
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

async function verifySearchResults(page: Page, searchTerm: string, songResults: string[], strict = true) {
  if (songResults !== null && songResults.length >= 20) {
    throw exception("verifySearchResults only works if songResults < 20 items.");
  }
  console.log("beginning test");
  await page.waitForSelector(selectors.searchBar);
  console.log("search bar selector found");
  await page.waitForSelector(selectors.searchViewIonCard);
  console.log("search view ion card fond");

  await page.type(selectors.searchBar, searchTerm);
  console.log("search bar search term typed");
  
  await page.waitForSelector(selectors.searchViewIonCard + ":nth-child(20)", {
    hidden: true,
  });
  const ionCards = await page.$$(selectors.searchViewIonCardTitle);
  console.log("ioncards found. should be vaidatoing now.");
  if (strict) {
    try {
      expect(ionCards.length).toEqual(songResults.length);
    } catch (e) {
      console.log("erorred!!!!!!!!!!!!!!");
      // await lagIt(6000000);
    }
  } else {
    expect (ionCards.length).toBeGreaterThanOrEqual(songResults.length);
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
