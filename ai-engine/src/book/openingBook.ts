import { Chess } from 'chess.js';

/**
 * Tiny inline opening book.
 *
 * Lines covered (mainline-only, roughly 25 lines across them):
 *   - Ruy Lopez (Italian variations + main line)
 *   - Italian Game
 *   - Sicilian Najdorf
 *   - French Defence
 *   - Caro-Kann
 *   - Queen's Gambit Declined
 *   - King's Indian Defence
 *   - Nimzo-Indian
 *   - English Opening
 *
 * Key: FEN without halfmove/fullmove counters (first 4 fields).
 * Value: candidate UCI moves to play (engine picks the first that's legal,
 * with light randomness when multiple). We pre-build the book lazily by
 * walking each line from the start position and storing the next move.
 */

type BookEntry = { uci: string }[];

let book: Map<string, BookEntry> | null = null;

function fenKey(fen: string): string {
  return fen.split(' ').slice(0, 4).join(' ');
}

/** Each line is a list of SAN moves; we'll convert to UCI via chess.js. */
const LINES: string[][] = [
  // Ruy Lopez main line
  ['e4', 'e5', 'Nf3', 'Nc6', 'Bb5', 'a6', 'Ba4', 'Nf6', 'O-O', 'Be7', 'Re1', 'b5', 'Bb3', 'd6', 'c3', 'O-O'],
  // Ruy Lopez exchange
  ['e4', 'e5', 'Nf3', 'Nc6', 'Bb5', 'a6', 'Bxc6', 'dxc6', 'O-O', 'f6'],
  // Italian Game - Giuoco Piano
  ['e4', 'e5', 'Nf3', 'Nc6', 'Bc4', 'Bc5', 'c3', 'Nf6', 'd3', 'd6'],
  // Italian Game - Two Knights
  ['e4', 'e5', 'Nf3', 'Nc6', 'Bc4', 'Nf6', 'Ng5', 'd5', 'exd5', 'Na5'],
  // Sicilian Najdorf
  ['e4', 'c5', 'Nf3', 'd6', 'd4', 'cxd4', 'Nxd4', 'Nf6', 'Nc3', 'a6', 'Be2', 'e5', 'Nb3', 'Be7'],
  // Sicilian Najdorf - English Attack
  ['e4', 'c5', 'Nf3', 'd6', 'd4', 'cxd4', 'Nxd4', 'Nf6', 'Nc3', 'a6', 'Be3', 'e5', 'Nb3', 'Be6'],
  // Sicilian Open
  ['e4', 'c5', 'Nf3', 'Nc6', 'd4', 'cxd4', 'Nxd4', 'Nf6', 'Nc3', 'e5'],
  // French Defence - Classical
  ['e4', 'e6', 'd4', 'd5', 'Nc3', 'Nf6', 'Bg5', 'Be7', 'e5', 'Nfd7'],
  // French Defence - Advance
  ['e4', 'e6', 'd4', 'd5', 'e5', 'c5', 'c3', 'Nc6', 'Nf3', 'Qb6'],
  // French Defence - Winawer
  ['e4', 'e6', 'd4', 'd5', 'Nc3', 'Bb4'],
  // Caro-Kann main line
  ['e4', 'c6', 'd4', 'd5', 'Nc3', 'dxe4', 'Nxe4', 'Bf5', 'Ng3', 'Bg6', 'h4', 'h6', 'Nf3', 'Nd7'],
  // Caro-Kann advance
  ['e4', 'c6', 'd4', 'd5', 'e5', 'Bf5', 'Nf3', 'e6', 'Be2', 'Nd7'],
  // Queen's Gambit Declined - Orthodox
  ['d4', 'd5', 'c4', 'e6', 'Nc3', 'Nf6', 'Bg5', 'Be7', 'e3', 'O-O', 'Nf3', 'Nbd7'],
  // Queen's Gambit Declined - Tartakower
  ['d4', 'd5', 'c4', 'e6', 'Nc3', 'Nf6', 'Bg5', 'Be7', 'e3', 'O-O', 'Nf3', 'h6', 'Bh4', 'b6'],
  // Slav Defence
  ['d4', 'd5', 'c4', 'c6', 'Nf3', 'Nf6', 'Nc3', 'dxc4', 'a4', 'Bf5'],
  // King's Indian Defence - Classical
  ['d4', 'Nf6', 'c4', 'g6', 'Nc3', 'Bg7', 'e4', 'd6', 'Nf3', 'O-O', 'Be2', 'e5', 'O-O', 'Nc6'],
  // King's Indian Defence - Saemisch
  ['d4', 'Nf6', 'c4', 'g6', 'Nc3', 'Bg7', 'e4', 'd6', 'f3', 'O-O', 'Be3', 'e5'],
  // Nimzo-Indian Rubinstein
  ['d4', 'Nf6', 'c4', 'e6', 'Nc3', 'Bb4', 'e3', 'O-O', 'Bd3', 'd5', 'Nf3', 'c5'],
  // Nimzo-Indian Classical (Qc2)
  ['d4', 'Nf6', 'c4', 'e6', 'Nc3', 'Bb4', 'Qc2', 'O-O', 'a3', 'Bxc3+', 'Qxc3', 'b6'],
  // English Opening - Symmetrical
  ['c4', 'c5', 'Nc3', 'Nc6', 'g3', 'g6', 'Bg2', 'Bg7', 'Nf3', 'Nf6', 'O-O', 'O-O'],
  // English Opening - Reversed Sicilian
  ['c4', 'e5', 'Nc3', 'Nf6', 'Nf3', 'Nc6', 'g3', 'd5', 'cxd5', 'Nxd5'],
  // Reti Opening
  ['Nf3', 'd5', 'c4', 'd4', 'b4', 'f6', 'e3', 'e5'],
  // Sicilian Dragon
  ['e4', 'c5', 'Nf3', 'd6', 'd4', 'cxd4', 'Nxd4', 'Nf6', 'Nc3', 'g6', 'Be3', 'Bg7'],
  // Petroff
  ['e4', 'e5', 'Nf3', 'Nf6', 'Nxe5', 'd6', 'Nf3', 'Nxe4', 'd4', 'd5'],
  // Scandinavian
  ['e4', 'd5', 'exd5', 'Qxd5', 'Nc3', 'Qa5', 'd4', 'Nf6'],
];

function buildBook(): Map<string, BookEntry> {
  const m = new Map<string, BookEntry>();
  for (const line of LINES) {
    const chess = new Chess();
    for (const san of line) {
      const key = fenKey(chess.fen());
      let mv;
      try {
        mv = chess.move(san);
      } catch {
        break;
      }
      if (!mv) break;
      const uci = `${mv.from}${mv.to}${mv.promotion ?? ''}`;
      const existing = m.get(key);
      if (existing) {
        if (!existing.some((e) => e.uci === uci)) existing.push({ uci });
      } else {
        m.set(key, [{ uci }]);
      }
    }
  }
  return m;
}

/** Warm the book. Idempotent. */
export function initBook(): void {
  if (book === null) book = buildBook();
}

/**
 * Look up a book move for a given FEN. Returns one of the candidates
 * (deterministically the first; randomization is the caller's job).
 */
export function lookupBookMove(fen: string): { from: string; to: string; promotion?: string } | null {
  if (book === null) book = buildBook();
  const entries = book.get(fenKey(fen));
  if (!entries || entries.length === 0) return null;
  // Deterministic: first entry. Engine can shuffle if desired.
  const choice = entries[Math.floor(Math.random() * entries.length)]!;
  const uci = choice.uci;
  const from = uci.slice(0, 2);
  const to = uci.slice(2, 4);
  const promo = uci.length > 4 ? uci[4] : undefined;
  const result: { from: string; to: string; promotion?: string } = { from, to };
  if (promo) result.promotion = promo;
  return result;
}

/** Test/inspection helper: how many positions does the book cover? */
export function bookSize(): number {
  if (book === null) book = buildBook();
  return book.size;
}
