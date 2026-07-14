import { isFetchableUrl } from "../../utils/SongUtils";

describe("isFetchableUrl", () => {
  it("returns true for a non-empty url string", () => {
    expect(isFetchableUrl("https://example.com/image.png")).toBe(true);
    expect(isFetchableUrl("/relative/path.png")).toBe(true);
  });

  it("returns false for undefined or null", () => {
    expect(isFetchableUrl(undefined)).toBe(false);
    expect(isFetchableUrl(null)).toBe(false);
  });

  it("returns false for empty or whitespace-only strings", () => {
    expect(isFetchableUrl("")).toBe(false);
    expect(isFetchableUrl("   ")).toBe(false);
    expect(isFetchableUrl("\t\n")).toBe(false);
  });

  it("does not coerce the literal 'undefined' string trap", () => {
    // The bug this guards against: fetch(undefined) -> request to "/undefined".
    // The guard must reject the undefined value BEFORE it ever reaches fetch().
    const maybeUrl: string | undefined = undefined;
    expect(isFetchableUrl(maybeUrl)).toBe(false);
    // A literal "undefined" string is technically fetchable and must NOT be
    // rejected by this helper (it only guards nullish/empty, not app logic bugs).
    expect(isFetchableUrl("undefined")).toBe(true);
  });
});
