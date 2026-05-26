# @chess-ai/engine

TypeScript chess engine for the chess-ai web app.
Implements minimax + alpha-beta + quiescence + a small opening book,
exposes selectable difficulty, and runs comfortably inside a Web Worker.

`chess.js` is the source of truth for move legality and FEN parsing — the
engine never invents moves outside its API.

---

## Install / build

```bash
npm install            # at workspace root, or inside ai-engine/
npm run build          # vite library build + .d.ts
npm test               # vitest run
```

Output goes to `dist/index.js` and `dist/worker.js` (ESM, externals: chess.js).

---

## Public API (matches `SHARED_CONTRACTS.md` §3)

```ts
import { createEngine, type ChessEngine, type Difficulty, type MoveResult } from '@chess-ai/engine';

const engine = createEngine();
await engine.init();

const move: MoveResult = await engine.getBestMove(fen, 'master');
//        ^ { from, to, promotion?, evaluation, depthReached, nodesSearched }

const cp: number = await engine.evaluatePosition(fen); // centipawns, white perspective

engine.stop(); // aborts current search (checked between iterations + per node)
```

### Web Worker entry

```ts
const worker = new Worker(new URL('@chess-ai/engine/worker', import.meta.url), { type: 'module' });

worker.postMessage({ id: 'req-1', type: 'getBestMove', fen, difficulty: 'advanced' });

worker.onmessage = (e) => {
  const { id, ok, result, error } = e.data;
  // { id, ok: true, result: MoveResult } | { id, ok: false, error: string }
};
```

Supported message types: `init`, `getBestMove`, `evaluate`, `stop`.
All responses are tagged with the original `id` for request/response correlation.

---

## Difficulty table

| Difficulty   | Depth         | Randomness | Top-K sampling | Opening book | Quiescence |
|--------------|---------------|------------|----------------|--------------|------------|
| beginner     | 1             | 40%        | 10             | no           | no         |
| casual       | 2             | 15%        | 5              | no           | no         |
| intermediate | 3             | 5%         | 1              | no           | yes        |
| advanced     | 4             | 0%         | 1              | no           | yes        |
| master       | 5 (iterative) | 0%         | 1              | yes          | yes        |

Randomness model: search runs first; for beginner/casual the engine picks
uniformly from the top-K scored candidates, then with probability =
randomness it swaps that choice for a uniformly random legal move.
Intermediate keeps the search's actual best move but still has a 5%
random-move swap.

---

## Internals

- **Search:** negamax with alpha-beta pruning. Scores are internally
  side-to-move; public `evaluation` and `evaluatePosition()` are
  white-perspective in centipawns. Iterative deepening is used for
  `master`, which also checks `stop()` between depth iterations.
- **Quiescence:** captures + promotions only, max 4 plies past horizon,
  MVV-LVA ordered. Stand-pat with beta cutoff.
- **Move ordering:** PV/hash → MVV-LVA captures → promotions → killer
  moves (2 per ply) → history heuristic (depth^2 weighted).
- **Evaluation:** material + piece-square tables (precomputed and mirrored
  for black) + mobility differential + king safety (pawn shield + castled
  bonus, middlegame only) + pawn structure (doubled / isolated /
  passed-pawn bonuses).
- **Opening book:** ~25 ECO mainlines inlined (Ruy Lopez, Italian, Sicilian
  Najdorf/Dragon/Open, French, Caro-Kann, QGD, Slav, KID, Nimzo, English,
  Reti, Petroff, Scandinavian). Keyed by FEN with halfmove/fullmove
  counters stripped. Used only by `master`.

No `node:*` imports anywhere — the engine runs unmodified in a browser
Web Worker.

---

## Performance notes

Target: `master` returns a move in <2s on the starting position at
effective depth 4 (with iterative deepening reaching depth 5 in many
positions), on a 2020-era laptop CPU. Beginner/casual/intermediate are
effectively instant.

Big levers if performance is ever an issue: a transposition table (Zobrist
hashing), null-move pruning, late-move reductions, and aspiration windows
at the root.

---

## Testing

- `test/eval.test.ts` — starting position ~0 cp, material imbalances
  detected correctly, mate scores read.
- `test/tactics.test.ts` — 5 mate-in-1, 3 mate-in-2 puzzles. Mate-in-1s
  use `advanced` (depth 4), mate-in-2s use `master` (depth 5 + qsearch).
- `test/difficulty.test.ts` — verifies the difficulty mapping, beginner
  variance >30% over 100 trials, master deterministic on a non-book
  mid-game position.

Run with `npm test`.

---

## Known limitations

- No transposition table → some re-search overhead at depth 5.
- King safety is a simple pawn-shield count; doesn't model attacker
  weight near the king.
- Endgame detection is a single material threshold, no tablebase.
- The opening book is intentionally tiny (~25 lines) and randomized only
  inside book candidates; for a serious bot you'd plug in a Polyglot
  `.bin` book.
