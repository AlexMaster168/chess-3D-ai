/**
 * Simple Elo update with K=32, per SHARED_CONTRACTS.md.
 *
 * AI players use fixed ratings keyed by difficulty:
 *   beginner 800, casual 1100, intermediate 1500, advanced 1800, master 2100.
 */

export type Difficulty = 'beginner' | 'casual' | 'intermediate' | 'advanced' | 'master';
export type GameResult = '1-0' | '0-1' | '1/2-1/2';

export const K_FACTOR = 32;

export const AI_RATINGS: Record<Difficulty, number> = {
  beginner: 800,
  casual: 1100,
  intermediate: 1500,
  advanced: 1800,
  master: 2100,
};

export const AI_DIFFICULTIES: Difficulty[] = [
  'beginner',
  'casual',
  'intermediate',
  'advanced',
  'master',
];

/** Convert "ai:beginner" style id -> difficulty. Returns null when not an AI id. */
export function parseAiId(id: string): Difficulty | null {
  if (!id.startsWith('ai:')) return null;
  const diff = id.slice(3) as Difficulty;
  return AI_DIFFICULTIES.includes(diff) ? diff : null;
}

export function aiPlayerName(d: Difficulty): string {
  return `AI ${d.charAt(0).toUpperCase()}${d.slice(1)}`;
}

/** Expected score for player A against player B. */
export function expectedScore(ratingA: number, ratingB: number): number {
  return 1 / (1 + Math.pow(10, (ratingB - ratingA) / 400));
}

/**
 * Compute new Elo ratings for white and black given the result.
 * Returns rounded integers. White's score: 1 = win, 0.5 = draw, 0 = loss.
 */
export function updateRatings(
  whiteRating: number,
  blackRating: number,
  result: GameResult,
): { whiteRating: number; blackRating: number } {
  const whiteScore = result === '1-0' ? 1 : result === '0-1' ? 0 : 0.5;
  const blackScore = 1 - whiteScore;

  const expWhite = expectedScore(whiteRating, blackRating);
  const expBlack = expectedScore(blackRating, whiteRating);

  const newWhite = Math.round(whiteRating + K_FACTOR * (whiteScore - expWhite));
  const newBlack = Math.round(blackRating + K_FACTOR * (blackScore - expBlack));

  return { whiteRating: newWhite, blackRating: newBlack };
}
