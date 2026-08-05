import { buildSheetMusicUrl, isImageResponse } from "../../utils/SongUtils";

/**
 * Regression tests for issue #211:
 * "blob download sometimes will be html page instead of the img".
 *
 * Root cause chain proven on production (SFOG 80):
 *  1. MusicView built the URL as `songbook?.musicUrl + makeThreeDigits(n) + ".png"`.
 *     Before the async songbook load resolved, `songbook?.musicUrl` was undefined,
 *     yielding the string "undefined080.png" — a non-empty, fetchable-looking
 *     RELATIVE url that `isFetchableUrl` did NOT reject.
 *  2. NavigationBar fetched it -> 404 HTML error page.
 *  3. `.blob()` turned the HTML into a blob with no image validation.
 *  4. The download button (download="sfog_80", no extension) saved it as
 *     "Sfog_80.html".
 *
 * These tests pin the two guards that break that chain:
 *  - buildSheetMusicUrl never emits an "undefined...png" url.
 *  - isImageResponse rejects non-2xx / non-image responses before blob creation.
 */

describe("buildSheetMusicUrl (guards #211 at the source)", () => {
  const base = "https://raw.githubusercontent.com/Church-Life-Apps/Resources/master/resources/images/sfog/SFOG_";

  it("builds a zero-padded absolute PNG url when the base is present", () => {
    expect(buildSheetMusicUrl(base, 80)).toBe(`${base}080.png`);
    expect(buildSheetMusicUrl(base, 1)).toBe(`${base}001.png`);
    expect(buildSheetMusicUrl(base, 156)).toBe(`${base}156.png`);
  });

  it("honors a tune suffix (e.g. SHL second tune)", () => {
    expect(buildSheetMusicUrl(base, 278, "-B")).toBe(`${base}278-B.png`);
  });

  it("returns empty string (NOT 'undefined...png') when the base is undefined", () => {
    // This is the exact bug: undefined base must never become "undefined080.png".
    expect(buildSheetMusicUrl(undefined, 80)).toBe("");
    expect(buildSheetMusicUrl(undefined, 80)).not.toContain("undefined");
  });

  it("returns empty string for null/empty/whitespace base", () => {
    expect(buildSheetMusicUrl(null, 1)).toBe("");
    expect(buildSheetMusicUrl("", 1)).toBe("");
    expect(buildSheetMusicUrl("   ", 1)).toBe("");
  });
});

describe("isImageResponse (guards #211 at the fetch boundary)", () => {
  const makeResp = (ok: boolean, status: number, contentType: string | null) => ({
    ok,
    headers: { get: (name: string) => (name.toLowerCase() === "content-type" ? contentType : null) },
  });

  it("accepts a 200 image/png response", () => {
    expect(isImageResponse(makeResp(true, 200, "image/png"))).toBe(true);
  });

  it("accepts other image types and ignores charset params", () => {
    expect(isImageResponse(makeResp(true, 200, "image/jpeg"))).toBe(true);
    expect(isImageResponse(makeResp(true, 200, "IMAGE/PNG"))).toBe(true);
  });

  it("rejects a 404 HTML error page (the exact #211 payload)", () => {
    expect(isImageResponse(makeResp(false, 404, "text/html; charset=utf-8"))).toBe(false);
  });

  it("rejects a 200 that is not an image (defensive)", () => {
    expect(isImageResponse(makeResp(true, 200, "text/html"))).toBe(false);
    expect(isImageResponse(makeResp(true, 200, null))).toBe(false);
  });
});
