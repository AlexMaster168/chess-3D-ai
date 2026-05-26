/**
 * Piece-Square Tables (PSTs)
 *
 * Indexed 0..63 from white's perspective: a8=0, h8=7, ..., a1=56, h1=63.
 * That matches chess.js square indexing (board() rank order: rank 8 first).
 * Values are in centipawns.
 *
 * For black we mirror vertically: blackIndex = 56 ^ whiteIndex (XOR flips rank).
 *
 * These are pretty standard tables loosely cribbed from Tomasz Michniewski's
 * "Simplified Evaluation Function" with light tweaks.
 */

// 64-square tables, row 0 = rank 8 (a8..h8), row 7 = rank 1 (a1..h1)

export const PAWN_PST: readonly number[] = [
   0,  0,  0,  0,  0,  0,  0,  0,
  50, 50, 50, 50, 50, 50, 50, 50,
  10, 10, 20, 30, 30, 20, 10, 10,
   5,  5, 10, 25, 25, 10,  5,  5,
   0,  0,  0, 20, 20,  0,  0,  0,
   5, -5,-10,  0,  0,-10, -5,  5,
   5, 10, 10,-20,-20, 10, 10,  5,
   0,  0,  0,  0,  0,  0,  0,  0,
];

export const KNIGHT_PST: readonly number[] = [
  -50,-40,-30,-30,-30,-30,-40,-50,
  -40,-20,  0,  0,  0,  0,-20,-40,
  -30,  0, 10, 15, 15, 10,  0,-30,
  -30,  5, 15, 20, 20, 15,  5,-30,
  -30,  0, 15, 20, 20, 15,  0,-30,
  -30,  5, 10, 15, 15, 10,  5,-30,
  -40,-20,  0,  5,  5,  0,-20,-40,
  -50,-40,-30,-30,-30,-30,-40,-50,
];

export const BISHOP_PST: readonly number[] = [
  -20,-10,-10,-10,-10,-10,-10,-20,
  -10,  0,  0,  0,  0,  0,  0,-10,
  -10,  0,  5, 10, 10,  5,  0,-10,
  -10,  5,  5, 10, 10,  5,  5,-10,
  -10,  0, 10, 10, 10, 10,  0,-10,
  -10, 10, 10, 10, 10, 10, 10,-10,
  -10,  5,  0,  0,  0,  0,  5,-10,
  -20,-10,-10,-10,-10,-10,-10,-20,
];

export const ROOK_PST: readonly number[] = [
   0,  0,  0,  0,  0,  0,  0,  0,
   5, 10, 10, 10, 10, 10, 10,  5,
  -5,  0,  0,  0,  0,  0,  0, -5,
  -5,  0,  0,  0,  0,  0,  0, -5,
  -5,  0,  0,  0,  0,  0,  0, -5,
  -5,  0,  0,  0,  0,  0,  0, -5,
  -5,  0,  0,  0,  0,  0,  0, -5,
   0,  0,  0,  5,  5,  0,  0,  0,
];

export const QUEEN_PST: readonly number[] = [
  -20,-10,-10, -5, -5,-10,-10,-20,
  -10,  0,  0,  0,  0,  0,  0,-10,
  -10,  0,  5,  5,  5,  5,  0,-10,
   -5,  0,  5,  5,  5,  5,  0, -5,
    0,  0,  5,  5,  5,  5,  0, -5,
  -10,  5,  5,  5,  5,  5,  0,-10,
  -10,  0,  5,  0,  0,  0,  0,-10,
  -20,-10,-10, -5, -5,-10,-10,-20,
];

export const KING_PST_MIDDLEGAME: readonly number[] = [
  -30,-40,-40,-50,-50,-40,-40,-30,
  -30,-40,-40,-50,-50,-40,-40,-30,
  -30,-40,-40,-50,-50,-40,-40,-30,
  -30,-40,-40,-50,-50,-40,-40,-30,
  -20,-30,-30,-40,-40,-30,-30,-20,
  -10,-20,-20,-20,-20,-20,-20,-10,
   20, 20,  0,  0,  0,  0, 20, 20,
   20, 30, 10,  0,  0, 10, 30, 20,
];

export const KING_PST_ENDGAME: readonly number[] = [
  -50,-40,-30,-20,-20,-30,-40,-50,
  -30,-20,-10,  0,  0,-10,-20,-30,
  -30,-10, 20, 30, 30, 20,-10,-30,
  -30,-10, 30, 40, 40, 30,-10,-30,
  -30,-10, 30, 40, 40, 30,-10,-30,
  -30,-10, 20, 30, 30, 20,-10,-30,
  -30,-30,  0,  0,  0,  0,-30,-30,
  -50,-30,-30,-30,-30,-30,-30,-50,
];

export type PieceType = 'p' | 'n' | 'b' | 'r' | 'q' | 'k';

/** Precomputed mirrored tables for black. Filled by precomputePST(). */
const blackPST: Record<string, number[]> = {
  p: [],
  n: [],
  b: [],
  r: [],
  q: [],
  k_mg: [],
  k_eg: [],
};

let warmed = false;

function mirror(t: readonly number[]): number[] {
  const out = new Array<number>(64);
  for (let i = 0; i < 64; i++) {
    // Flip rank only: rank index = i>>3, file = i&7; mirror rank = 7-(i>>3)
    const file = i & 7;
    const rank = i >> 3;
    const mirroredIndex = ((7 - rank) << 3) | file;
    out[i] = t[mirroredIndex] as number;
  }
  return out;
}

export function precomputePST(): void {
  if (warmed) return;
  blackPST.p = mirror(PAWN_PST);
  blackPST.n = mirror(KNIGHT_PST);
  blackPST.b = mirror(BISHOP_PST);
  blackPST.r = mirror(ROOK_PST);
  blackPST.q = mirror(QUEEN_PST);
  blackPST.k_mg = mirror(KING_PST_MIDDLEGAME);
  blackPST.k_eg = mirror(KING_PST_ENDGAME);
  warmed = true;
}

export function pstValue(
  piece: PieceType,
  color: 'w' | 'b',
  squareIndex: number,
  endgame: boolean,
): number {
  if (!warmed) precomputePST();

  if (piece === 'k') {
    if (color === 'w') {
      return (endgame ? KING_PST_ENDGAME : KING_PST_MIDDLEGAME)[squareIndex] as number;
    }
    return (endgame ? blackPST.k_eg : blackPST.k_mg)[squareIndex] as number;
  }

  if (color === 'w') {
    switch (piece) {
      case 'p': return PAWN_PST[squareIndex] as number;
      case 'n': return KNIGHT_PST[squareIndex] as number;
      case 'b': return BISHOP_PST[squareIndex] as number;
      case 'r': return ROOK_PST[squareIndex] as number;
      case 'q': return QUEEN_PST[squareIndex] as number;
    }
  }
  return blackPST[piece]![squareIndex] as number;
}
