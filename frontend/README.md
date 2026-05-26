# @chess-ai/frontend

Vue 3 + Vuex 4 single-page app for the chess-ai project. Integrates the
`@chess-ai/design` 3D board, the `@chess-ai/engine` AI (run inside a Web
Worker), and the backend REST API.

## Run

```bash
npm install
npm run dev        # http://localhost:5173
npm run build
npm run preview
```

The dev server proxies `/api` to `http://localhost:4000` (the backend default).
Override with `VITE_API_BASE_URL` if needed.

## Workspace dependencies

`package.json` references the sibling packages by relative path:

```jsonc
"@chess-ai/design": "file:../design",
"@chess-ai/engine": "file:../ai-engine"
```

Both packages are imported dynamically with a runtime try/catch:

- `Board3DHost.vue` imports `@chess-ai/design`; if missing, renders a 2D
  fallback grid driven by chess.js.
- `workers/chess.worker.ts` imports `@chess-ai/engine`; if missing, falls
  back to a random-legal-move stub.

So the frontend always boots, even if the sibling packages haven't been
built yet. Replace the stubs by simply building the sibling packages —
no code changes required.

## Project structure

```
src/
  App.vue
  main.ts
  router/index.ts
  store/
    index.ts
    modules/{player,game,ai,analytics,board}.ts
  services/
    api.ts                 # typed axios client for backend
    engineWorker.ts        # main-thread proxy for the worker
  workers/
    chess.worker.ts        # spawns @chess-ai/engine inside a Worker
  components/
    Board3DHost.vue
    MoveList.vue
    EvalBar.vue
    CapturedPieces.vue
    Timers.vue
    PromotionDialog.vue
    DifficultyPicker.vue
    ThemePicker.vue
    charts/
      RatingCurve.vue
      WinrateDonut.vue
      OpeningsBar.vue
  views/
    LobbyView.vue
    GameView.vue
    HistoryView.vue
    PlayerAnalyticsView.vue
    LeaderboardView.vue
  styles/global.css
  types/shared.ts          # mirrors SHARED_CONTRACTS.md types
```

## Vuex modules

- `player` — current player, register / load from backend, localStorage cache.
- `game` — chess.js-backed FEN/PGN/move history, status, resign/draw, save-on-end.
- `ai` — `requestMove`, `evaluate` actions backed by the engine Web Worker.
- `analytics` — player + global + leaderboard + history fetched from backend.
- `board` — 3D theme, animation speed, highlights, selection.

All modules use `namespaced: true`.

## Contract assumptions

- 3D module: `createBoard()` returns a `ChessBoard3D` matching the
  `SHARED_CONTRACTS.md` interface; it emits `move` for drag-drop and
  accepts FEN updates via `setBoardState`. Until built, the host falls
  back to a 2D grid.
- AI engine: `createEngine()` returns an object with `init`, `getBestMove`,
  `evaluatePosition`, `stop`. Difficulty strings come straight from the
  contract.
- Backend: all routes under `/api`, return JSON matching the DTOs in the
  contract.
