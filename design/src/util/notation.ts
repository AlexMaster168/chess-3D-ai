/**
 * Algebraic-square <-> world coordinate helpers.
 * Board is centered at origin, square edge length = 1.
 */

export const FILES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'] as const;
export const RANKS = ['1', '2', '3', '4', '5', '6', '7', '8'] as const;

export const SQUARE_SIZE = 1;
export const BOARD_OFFSET = -3.5; // (-(8-1)/2)

export function isValidSquare(sq: string): boolean {
  return sq.length === 2 && FILES.includes(sq[0] as (typeof FILES)[number]) && RANKS.includes(sq[1] as (typeof RANKS)[number]);
}

export function squareToIndex(square: string): { file: number; rank: number } {
  const file = FILES.indexOf(square[0] as (typeof FILES)[number]);
  const rank = RANKS.indexOf(square[1] as (typeof RANKS)[number]);
  if (file === -1 || rank === -1) {
    throw new Error(`Invalid square: ${square}`);
  }
  return { file, rank };
}

export function indexToSquare(file: number, rank: number): string {
  return `${FILES[file]}${RANKS[rank]}`;
}

export function squareToWorld(square: string): { x: number; z: number } {
  const { file, rank } = squareToIndex(square);
  return {
    x: BOARD_OFFSET + file * SQUARE_SIZE,
    // Use -rank so white is on +z side (camera-friendly).
    z: -(BOARD_OFFSET + rank * SQUARE_SIZE)
  };
}

export function worldToSquare(x: number, z: number): string | null {
  const file = Math.round((x - BOARD_OFFSET) / SQUARE_SIZE);
  const rank = Math.round((-z - BOARD_OFFSET) / SQUARE_SIZE);
  if (file < 0 || file > 7 || rank < 0 || rank > 7) return null;
  return indexToSquare(file, rank);
}

export function isLightSquare(square: string): boolean {
  const { file, rank } = squareToIndex(square);
  return (file + rank) % 2 === 1;
}
