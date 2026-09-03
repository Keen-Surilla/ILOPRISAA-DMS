export interface RosterAthlete {
  id: string;
  name: string;
}

export interface AthleteMatchResult {
  athleteId: string | null;
  athleteName: string | null;
  isAmbiguous: boolean;
}

/**
 * Deliberately simple, deterministic, and inspectable: this is NOT another
 * AI call. Once a name has been extracted from a document by Cloud Vision,
 * matching that text to a specific roster entry is a plain string-comparison
 * problem — running it through another opaque model would add cost and
 * unpredictability for no real benefit, and would be much harder to defend
 * as reliable in a thesis panel setting than "these N tokens overlap."
 */
function normalizeToTokens(name: string): string[] {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // strip accents (é -> e, ñ -> n, etc.)
    .replace(/[^a-z\s]/g, ' ')
    .split(/\s+/)
    .filter(Boolean);
}

/**
 * Fraction of the ROSTER athlete's name tokens that appear somewhere in a
 * block of text. Using the roster name as the denominator (not the input
 * text) matters: the input here is a whole page's OCR text — long and noisy
 * (headers, form labels, other people's names on a consent form) — so we
 * only ask "is this athlete's full name present in there somewhere," not
 * "does the text equal the name."
 */
function nameOverlapScore(documentText: string, rosterName: string): number {
  const documentTokens = new Set(normalizeToTokens(documentText));
  const rosterTokens = normalizeToTokens(rosterName);
  if (rosterTokens.length === 0) return 0;
  const matched = rosterTokens.filter((t) => documentTokens.has(t)).length;
  return matched / rosterTokens.length;
}

const CONFIDENT_MATCH_THRESHOLD = 0.75; // most of the athlete's name tokens must be present
const AMBIGUITY_MARGIN = 0.15; // if the top 2 candidates are this close, don't guess

/**
 * Searches a document's full OCR text for a confident match against a
 * coach's roster (Approach B: search the whole page, not just one extracted
 * "name" field — more forgiving of layout differences across document types,
 * and reuses the OCR text classify-document already produced instead of
 * requiring a second, narrower extraction call).
 *
 * Returns no match (athleteId: null) rather than a low-confidence guess
 * whenever the result would be uncertain — assigning a document to the WRONG
 * athlete is a privacy issue, not just a wrong-slot inconvenience, so this
 * function is tuned to prefer "skip, needs manual review" over a guess.
 */
export function matchAthleteInDocumentText(
  documentText: string | null | undefined,
  roster: RosterAthlete[]
): AthleteMatchResult {
  if (!documentText || !documentText.trim() || roster.length === 0) {
    return { athleteId: null, athleteName: null, isAmbiguous: false };
  }

  const scored = roster
    .map((athlete) => ({ ...athlete, score: nameOverlapScore(documentText, athlete.name) }))
    .filter((athlete) => athlete.score >= CONFIDENT_MATCH_THRESHOLD)
    .sort((a, b) => b.score - a.score);

  if (scored.length === 0) {
    return { athleteId: null, athleteName: null, isAmbiguous: false };
  }

  if (scored.length > 1 && scored[0].score - scored[1].score < AMBIGUITY_MARGIN) {
    // Two or more athletes on the roster are too similar to confidently pick one
    // (e.g. siblings, or a name that's a subset of another) — refuse to guess.
    return { athleteId: null, athleteName: null, isAmbiguous: true };
  }

  return { athleteId: scored[0].id, athleteName: scored[0].name, isAmbiguous: false };
}