/**
 * Converts a verse key (e.g. "v1", "c", "pc2") into a human-readable section
 * label (e.g. "Verse 1", "Chorus ", "Pre-Chorus 2").
 *
 * Uses an ordered longest-prefix match. Order matters: two-letter prefixes
 * ("pc", "bc") must be checked before their single-letter counterparts so that
 * e.g. "pc" maps to "Pre-Chorus " rather than being mangled by chained
 * substring replaces (the prior implementation produced "Pre-Chorus Chorus "
 * for "pc").
 */
export function getVerseText(verse: string): string {
  const v = verse.toLowerCase();
  const prefixMap: Array<[string, string]> = [
    ["pc", "Pre-Chorus "],
    ["bc", "Bridge "],
    ["v", "Verse "],
    ["c", "Chorus "],
    ["b", "Bridge "],
    ["p", "Pre-Chorus "],
  ];
  for (const [prefix, label] of prefixMap) {
    if (v.startsWith(prefix)) {
      return label + v.slice(prefix.length);
    }
  }
  return verse;
}
