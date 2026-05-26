import { Chess } from 'chess.js';
import { precomputePST, pstValue, type PieceType } from './pst.js';

/**
 * Evaluation function.
 *
 * Returns centipawns from the side-to-move perspective (for negamax).
 * A separate helper evaluateWhitePerspective() returns cp from white's
 * perspective, which is what the public ChessEngine.evaluatePosition() exposes.
 *
 * Components: material + PST + mobility + king safety + pawn structure
 * (doubled, isolated, passed).
 */

export const PIECE_VALUES: Record<PieceType, number> = {
  p: 100,
  n: 320,
  b: 330,
  r: 500,
  q: 900,
  k: 20000, // for material-only sanity; king never actually captured
};

// Square name helpers ----------------------------------------------------

function fileOf(square: string): number {
  // 'a'..'h' -> 0..7
  return square.charCodeAt(0) - 97;
}

function rankOf(square: string): number {
  // '1'..'8' -> 0..7 (white side first)
  return square.charCodeAt(1) - 49;
}

/** Convert chess.js algebraic square ("e4") to PST index 0..63 (a8 = 0). */
function squareToPSTIndex(square: string): number {
  const file = fileOf(square);
  const rank = rankOf(square);
  // PST index: rank 8 first => row = 7 - rank
  return ((7 - rank) << 3) | file;
}

// ------------------------------------------------------------------------

interface PieceCounts {
  P: number; N: number; B: number; R: number; Q: number;
  p: number; n: number; b: number; r: number; q: number;
}

interface BoardAnalysis {
  material: number;        // white minus black, centipawns
  pst: number;             // white minus black
  endgame: boolean;
  whitePawnFiles: number[]; // pawns per file (0..7)
  blackPawnFiles: number[];
  whitePawnsBySquare: { file: number; rank: number }[];
  blackPawnsBySquare: { file: number; rank: number }[];
  whiteKing?: string;
  blackKing?: string;
  counts: PieceCounts;
}

function analyzeBoard(chess: Chess): BoardAnalysis {
  const board = chess.board();
  let materialWhite = 0;
  let materialBlack = 0;
  let pstScore = 0;
  const counts: PieceCounts = { P: 0, N: 0, B: 0, R: 0, Q: 0, p: 0, n: 0, b: 0, r: 0, q: 0 };
  const whitePawnFiles = [0, 0, 0, 0, 0, 0, 0, 0];
  const blackPawnFiles = [0, 0, 0, 0, 0, 0, 0, 0];
  const whitePawnsBySquare: { file: number; rank: number }[] = [];
  const blackPawnsBySquare: { file: number; rank: number }[] = [];
  let whiteKing: string | undefined;
  let blackKing: string | undefined;

  // First pass: detect endgame condition without PST.
  // Endgame heuristic: both sides have no queens, OR every side with a queen
  // has at most one minor piece. We do a simplified version: total non-pawn
  // non-king material per side < 1300.
  let nonPKMaterialWhite = 0;
  let nonPKMaterialBlack = 0;

  for (let r = 0; r < 8; r++) {
    const row = board[r];
    if (!row) continue;
    for (let f = 0; f < 8; f++) {
      const piece = row[f];
      if (!piece) continue;
      const t = piece.type as PieceType;
      if (piece.color === 'w') {
        if (t !== 'p' && t !== 'k') nonPKMaterialWhite += PIECE_VALUES[t];
      } else {
        if (t !== 'p' && t !== 'k') nonPKMaterialBlack += PIECE_VALUES[t];
      }
    }
  }
  const endgame = nonPKMaterialWhite + nonPKMaterialBlack < 2600;

  for (let r = 0; r < 8; r++) {
    const row = board[r];
    if (!row) continue;
    for (let f = 0; f < 8; f++) {
      const piece = row[f];
      if (!piece) continue;
      const t = piece.type as PieceType;
      const sq = piece.square;
      const pstIdx = squareToPSTIndex(sq);
      const file = fileOf(sq);
      const rank = rankOf(sq);

      if (piece.color === 'w') {
        if (t !== 'k') materialWhite += PIECE_VALUES[t];
        pstScore += pstValue(t, 'w', pstIdx, endgame);
        const upper = t.toUpperCase() as keyof PieceCounts;
        counts[upper]++;
        if (t === 'p') {
          whitePawnFiles[file]!++;
          whitePawnsBySquare.push({ file, rank });
        } else if (t === 'k') {
          whiteKing = sq;
        }
      } else {
        if (t !== 'k') materialBlack += PIECE_VALUES[t];
        pstScore -= pstValue(t, 'b', pstIdx, endgame);
        counts[t]++;
        if (t === 'p') {
          blackPawnFiles[file]!++;
          blackPawnsBySquare.push({ file, rank });
        } else if (t === 'k') {
          blackKing = sq;
        }
      }
    }
  }

  return {
    material: materialWhite - materialBlack,
    pst: pstScore,
    endgame,
    whitePawnFiles,
    blackPawnFiles,
    whitePawnsBySquare,
    blackPawnsBySquare,
    whiteKing,
    blackKing,
    counts,
  };
}

// ------------------------- pawn structure -------------------------------

function pawnStructureScore(a: BoardAnalysis): number {
  let score = 0;

  // Doubled pawns: -15 cp per extra pawn on a file
  for (let f = 0; f < 8; f++) {
    if ((a.whitePawnFiles[f] as number) > 1) score -= 15 * ((a.whitePawnFiles[f] as number) - 1);
    if ((a.blackPawnFiles[f] as number) > 1) score += 15 * ((a.blackPawnFiles[f] as number) - 1);
  }

  // Isolated pawns: pawn with no friendly pawn on adjacent files: -12 cp
  for (let f = 0; f < 8; f++) {
    const left = f > 0 ? a.whitePawnFiles[f - 1] as number : 0;
    const right = f < 7 ? a.whitePawnFiles[f + 1] as number : 0;
    if ((a.whitePawnFiles[f] as number) > 0 && left === 0 && right === 0) {
      score -= 12 * (a.whitePawnFiles[f] as number);
    }
    const bL = f > 0 ? a.blackPawnFiles[f - 1] as number : 0;
    const bR = f < 7 ? a.blackPawnFiles[f + 1] as number : 0;
    if ((a.blackPawnFiles[f] as number) > 0 && bL === 0 && bR === 0) {
      score += 12 * (a.blackPawnFiles[f] as number);
    }
  }

  // Passed pawns: no enemy pawn on same or adjacent file ahead.
  for (const wp of a.whitePawnsBySquare) {
    let blocked = false;
    for (let df = -1; df <= 1; df++) {
      const file = wp.file + df;
      if (file < 0 || file > 7) continue;
      // black pawn ahead (greater rank index from white's POV)
      for (const bp of a.blackPawnsBySquare) {
        if (bp.file === file && bp.rank > wp.rank) {
          blocked = true;
          break;
        }
      }
      if (blocked) break;
    }
    if (!blocked) {
      // Bonus grows with rank
      const bonus = 10 + 10 * wp.rank;
      score += bonus;
    }
  }
  for (const bp of a.blackPawnsBySquare) {
    let blocked = false;
    for (let df = -1; df <= 1; df++) {
      const file = bp.file + df;
      if (file < 0 || file > 7) continue;
      for (const wp of a.whitePawnsBySquare) {
        if (wp.file === file && wp.rank < bp.rank) {
          blocked = true;
          break;
        }
      }
      if (blocked) break;
    }
    if (!blocked) {
      const bonus = 10 + 10 * (7 - bp.rank);
      score -= bonus;
    }
  }

  return score;
}

// ------------------------- king safety ----------------------------------

function kingSafetyScore(a: BoardAnalysis): number {
  if (a.endgame) return 0; // king activity already encoded in endgame PST
  let score = 0;

  if (a.whiteKing) {
    const f = fileOf(a.whiteKing);
    const r = rankOf(a.whiteKing);
    // pawn shield: count friendly pawns in 3 files in front of king
    let shield = 0;
    for (let df = -1; df <= 1; df++) {
      const file = f + df;
      if (file < 0 || file > 7) continue;
      for (const wp of a.whitePawnsBySquare) {
        if (wp.file === file && wp.rank > r && wp.rank <= r + 2) {
          shield++;
          break;
        }
      }
    }
    score += (shield - 3) * 12; // missing shield pawns hurt
    // Castled king bonus (g1/c1/b1)
    if (a.whiteKing === 'g1' || a.whiteKing === 'c1' || a.whiteKing === 'b1') {
      score += 20;
    }
  }
  if (a.blackKing) {
    const f = fileOf(a.blackKing);
    const r = rankOf(a.blackKing);
    let shield = 0;
    for (let df = -1; df <= 1; df++) {
      const file = f + df;
      if (file < 0 || file > 7) continue;
      for (const bp of a.blackPawnsBySquare) {
        if (bp.file === file && bp.rank < r && bp.rank >= r - 2) {
          shield++;
          break;
        }
      }
    }
    score -= (shield - 3) * 12;
    if (a.blackKing === 'g8' || a.blackKing === 'c8' || a.blackKing === 'b8') {
      score -= 20;
    }
  }

  return score;
}

// ------------------------- mobility -------------------------------------

function mobilityScore(chess: Chess): number {
  // chess.js exposes legal moves only for side-to-move. We approximate
  // mobility for both sides by toggling turn via FEN manipulation.
  const sideToMove = chess.turn();
  const myMobility = chess.moves().length;

  // Build a FEN with opposite side to move (no in-check guarantee, so wrap in try/catch).
  let oppMobility = 0;
  try {
    const fen = chess.fen();
    const parts = fen.split(' ');
    parts[1] = sideToMove === 'w' ? 'b' : 'w';
    parts[3] = '-'; // clear en-passant to avoid illegal-position errors
    const flipped = new Chess();
    // Some illegal positions (e.g. side to move is in check on your turn)
    // will throw; in that case just use 0 for opponent mobility.
    flipped.load(parts.join(' '));
    oppMobility = flipped.moves().length;
  } catch {
    oppMobility = 0;
  }

  const whiteMob = sideToMove === 'w' ? myMobility : oppMobility;
  const blackMob = sideToMove === 'b' ? myMobility : oppMobility;

  // ~3 cp per legal move differential.
  return (whiteMob - blackMob) * 3;
}

// ------------------------- public API -----------------------------------

/**
 * Evaluate position from white's perspective (cp).
 * This is what the public engine.evaluatePosition() returns.
 */
export function evaluateWhitePerspective(chess: Chess): number {
  precomputePST();

  // Terminal handling
  if (chess.isCheckmate()) {
    // The side to move is checkmated.
    return chess.turn() === 'w' ? -100000 : 100000;
  }
  if (chess.isDraw() || chess.isStalemate() || chess.isInsufficientMaterial() || chess.isThreefoldRepetition()) {
    return 0;
  }

  const a = analyzeBoard(chess);
  let score = a.material + a.pst;
  score += pawnStructureScore(a);
  score += kingSafetyScore(a);
  score += mobilityScore(chess);
  return score;
}

/**
 * Evaluate from side-to-move perspective (for negamax search).
 */
export function evaluate(chess: Chess): number {
  const white = evaluateWhitePerspective(chess);
  return chess.turn() === 'w' ? white : -white;
}
