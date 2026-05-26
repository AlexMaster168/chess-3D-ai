import type { PieceSpec, PieceColor, PieceType } from '../types.js';
import { indexToSquare } from './notation.js';

/**
 * Minimal FEN piece-placement parser.
 * We only consume the placement field (first whitespace-separated token).
 */
export function parseFen(fen: string): PieceSpec[] {
  const placement = fen.trim().split(/\s+/)[0];
  if (!placement) return [];

  const ranks = placement.split('/');
  if (ranks.length !== 8) {
    throw new Error(`Invalid FEN placement: expected 8 ranks, got ${ranks.length}`);
  }

  const pieces: PieceSpec[] = [];

  // FEN ranks are listed 8 -> 1 (top to bottom).
  for (let r = 0; r < 8; r++) {
    const rankStr = ranks[r];
    let file = 0;
    for (const ch of rankStr) {
      if (/[1-8]/.test(ch)) {
        file += Number(ch);
        continue;
      }
      const color: PieceColor = ch === ch.toUpperCase() ? 'w' : 'b';
      const type = ch.toLowerCase() as PieceType;
      if (!'pnbrqk'.includes(type)) {
        throw new Error(`Invalid FEN piece: ${ch}`);
      }
      if (file > 7) throw new Error(`Invalid FEN: file overflow on rank ${8 - r}`);
      const rankIdx = 7 - r;
      pieces.push({
        color,
        type,
        square: indexToSquare(file, rankIdx)
      });
      file++;
    }
    if (file !== 8) {
      throw new Error(`Invalid FEN: rank ${8 - r} has ${file} squares (expected 8)`);
    }
  }

  return pieces;
}

export const STARTING_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
