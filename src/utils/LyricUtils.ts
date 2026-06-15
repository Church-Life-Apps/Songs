/**
 * Util functions for rendering lyric section labels.
 */

/**
 * Ordered map of verse-key prefixes to friendly section labels.
 *
 * Order matters: longer prefixes MUST come before any shorter prefix they
 * share a leading character with, so that a multi-character key like "pc"
 * matches "Pre-Chorus " (prefix "pc") rather than being treated as prefix "p"
 * followed by a stray "c" (which produced the "Pre-Chorus Chorus " bug).
 *
 * Each value already includes a trailing space so that a numeric suffix
 * (e.g. "v1" -> "Verse 1") reads naturally; bare keys keep the trailing space
 * (e.g. "v" -> "Verse "). Callers that render into the DOM trim as needed.
 */
const SECTION_PREFIXES: Array<[string, string]> = [
  ["pc", "Pre-Chorus "],
  ["v", "Verse "],
  ["c", "Chorus "],
  ["b", "Bridge "],
  ["p", "Pre-Chorus "],
  ["i", "Interlude "],
  ["t", "Tag "],
  ["e", "Ending "],
];

/**
 * Converts a verse key (e.g. "v1", "pc2", "c", "bc") into its friendly section
 * label by matching the FIRST (longest-first) prefix in SECTION_PREFIXES and
 * appending whatever follows the prefix as a suffix.
 *
 * Examples:
 *   getSectionLabel("pc")  -> "Pre-Chorus "
 *   getSectionLabel("pc1") -> "Pre-Chorus 1"
 *   getSectionLabel("v1")  -> "Verse 1"
 *   getSectionLabel("c2")  -> "Chorus 2"
 *   getSectionLabel("b")   -> "Bridge "
 *
 * The match is case-insensitive. Keys with no recognized prefix are returned
 * unchanged (e.g. an unknown "x9" -> "x9").
 */
export function getSectionLabel(verse: string): string {
  const lower = verse.toLowerCase();
  for (const [prefix, label] of SECTION_PREFIXES) {
    if (lower.startsWith(prefix)) {
      const suffix = lower.slice(prefix.length);
      return `${label}${suffix}`;
    }
  }
  return verse;
}
