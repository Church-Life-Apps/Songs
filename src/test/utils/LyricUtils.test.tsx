import { getVerseText } from "../../utils/LyricUtils";

describe("getVerseText", () => {
  it("maps single-letter prefixes to full labels", () => {
    expect(getVerseText("v1")).toBe("Verse 1");
    expect(getVerseText("v2")).toBe("Verse 2");
    expect(getVerseText("c")).toBe("Chorus ");
    expect(getVerseText("c1")).toBe("Chorus 1");
    expect(getVerseText("b")).toBe("Bridge ");
    expect(getVerseText("b1")).toBe("Bridge 1");
    expect(getVerseText("p")).toBe("Pre-Chorus ");
    expect(getVerseText("p1")).toBe("Pre-Chorus 1");
  });

  // Regression: chained .replace() previously rendered "pc" as "Pre-Chorus Chorus "
  // because .replace("c", "Chorus ") fired on the "c" inside "pc" before the
  // "p" rule had a chance. Longest-prefix-match fixes this.
  it("handles 'pc' / 'pc1' / 'pc2' correctly (regression #8/#10)", () => {
    expect(getVerseText("pc")).toBe("Pre-Chorus ");
    expect(getVerseText("pc1")).toBe("Pre-Chorus 1");
    expect(getVerseText("pc2")).toBe("Pre-Chorus 2");
  });

  it("handles 'bc' correctly (no chained-replace collision)", () => {
    expect(getVerseText("bc")).toBe("Bridge ");
    expect(getVerseText("bc1")).toBe("Bridge 1");
  });

  it("is case-insensitive on the prefix", () => {
    expect(getVerseText("V1")).toBe("Verse 1");
    expect(getVerseText("PC2")).toBe("Pre-Chorus 2");
  });

  it("returns verse unchanged when no known prefix matches", () => {
    expect(getVerseText("intro")).toBe("intro");
    expect(getVerseText("outro")).toBe("outro");
    expect(getVerseText("tag")).toBe("tag");
  });
});
