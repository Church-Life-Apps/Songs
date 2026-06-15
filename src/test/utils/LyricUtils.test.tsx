import { getSectionLabel } from "../../utils/LyricUtils";

describe("Lyric Utils Tests", () => {
  it("maps the multi-char 'pc' prefix to Pre-Chorus (regression #251/#252)", () => {
    // Previously the chained single-char mapping turned "pc" into
    // "Pre-Chorus Chorus ". Longest-prefix-first must yield Pre-Chorus only.
    expect(getSectionLabel("pc")).toBe("Pre-Chorus ");
    expect(getSectionLabel("pc1")).toBe("Pre-Chorus 1");
    expect(getSectionLabel("pc2")).toBe("Pre-Chorus 2");
  });

  it("does not mangle other multi-char keys", () => {
    // "bc" starts with "b" (Bridge); the trailing "c" is kept as the suffix
    // rather than being re-expanded into "Chorus".
    expect(getSectionLabel("bc")).toBe("Bridge c");
  });

  it("maps single-letter prefixes with a numeric suffix", () => {
    expect(getSectionLabel("v1")).toBe("Verse 1");
    expect(getSectionLabel("c2")).toBe("Chorus 2");
    expect(getSectionLabel("p1")).toBe("Pre-Chorus 1");
  });

  it("maps bare single-letter keys to the label with a trailing space", () => {
    expect(getSectionLabel("v")).toBe("Verse ");
    expect(getSectionLabel("c")).toBe("Chorus ");
    expect(getSectionLabel("b")).toBe("Bridge ");
    expect(getSectionLabel("p")).toBe("Pre-Chorus ");
  });

  it("is case-insensitive", () => {
    expect(getSectionLabel("PC")).toBe("Pre-Chorus ");
    expect(getSectionLabel("PC3")).toBe("Pre-Chorus 3");
    expect(getSectionLabel("V1")).toBe("Verse 1");
    expect(getSectionLabel("B")).toBe("Bridge ");
  });

  it("returns the original key unchanged for an unknown prefix", () => {
    expect(getSectionLabel("x9")).toBe("x9");
    expect(getSectionLabel("zzz")).toBe("zzz");
  });
});
