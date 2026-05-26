# @chess-ai/design

Three.js-based 3D chess board for the chess-ai web app. Procedural geometry,
GSAP-driven cinematic animations, three swappable themes, and a single
public factory: `createBoard()`.

This package implements the `ChessBoard3D` interface defined in
`SHARED_CONTRACTS.md` section 1. The frontend imports it as an ESM module
and treats `three` / `gsap` as externals (deduped at the app level).

## Install

```bash
cd design
npm install
```

> `three` is declared as both a `peerDependency` and a `dependency` so the
> demo can run standalone; the library build marks it as external so the
> consumer (the Vue3 frontend) controls the version.

## Run the demo

```bash
npm run dev
```

Open the URL Vite prints (default `http://localhost:5174`). Keyboard
controls are listed in the on-screen panel. Drag the mouse to orbit, scroll
to zoom (clamped). Click squares to log `squareClick` events; two clicks on
different squares fire a `move` event.

## Build (library)

```bash
npm run build
```

Outputs ESM bundle and `.d.ts` files to `dist/`. `three` and `gsap` are
external — make sure the consumer installs them.

## API summary

```ts
import { createBoard, STARTING_FEN } from '@chess-ai/design';

const board = createBoard();
await board.mount(document.getElementById('app')!);

board.setBoardState(STARTING_FEN);           // place pieces (no animation)
board.setBoardState(nextFen, true);          // animate diff: glide + captures

board.setAnimationSpeed('slow' | 'normal' | 'fast');
board.setTheme('classic' | 'neon' | 'glass');
board.highlightSquares(['e2', 'e4'], 'last-move');
board.highlightSquares(legalMoves, 'legal');
board.playEffect('capture' | 'check' | 'checkmate' | 'castle');

board.on('squareClick', sq => { /* "e4" */ });
board.on('move', m => { /* { from: 'e2', to: 'e4' } */ });
board.on('animationEnd', kind => { /* 'move' | 'capture' | 'check' | 'checkmate' | 'castle' */ });

board.unmount();
```

## Animation gallery

| Effect      | Description                                                                  |
|-------------|------------------------------------------------------------------------------|
| Glide       | Pieces travel along a parabolic arc with eased lift + slight banking.        |
| Capture     | Target piece spins, scales to zero, releases a 50-particle additive puff.    |
| Check       | Red emissive ring pulses under the king (3 yoyo cycles, sine easing).        |
| Checkmate   | Camera dollies in, tone-mapping desaturates, short shake, restore.           |
| Castling    | King and rook glide in parallel via `Promise.all`.                           |
| Promotion   | Pawn lifts to ~1.2u, white flash via emissive rim, descends to new square.   |

## Themes

- `classic` — wood-feel with procedurally-generated normal maps, low bloom.
- `neon` — emissive squares/pieces, heavy bloom, dark backdrop.
- `glass` — `MeshPhysicalMaterial` with transmission/refraction, clearcoat.

`setTheme()` swaps materials live without touching transforms.

## Notes for integrators

- All exported types live at the top level of `index.ts`.
- The two-click → `move` flow is provided as a convenience; the frontend
  is expected to validate via chess.js before pushing the next FEN.
- `setBoardState` does a diff against the current pieces, reusing same-
  color/type meshes so animations look correct across consecutive FENs.
- `playEffect('check')` uses the most-recently tracked king; if you need
  to force which side, call `setSideInCheck('w' | 'b')` (internal helper
  exported on the concrete class but not in the contract).
- The renderer pixel ratio is capped at 2; resize is handled via a
  `ResizeObserver` on the container element.
