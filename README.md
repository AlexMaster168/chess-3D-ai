# ♛ chess-ai

**Полноценная веб-аркада шахмат с 3D-доской, собственным AI-движком и аналитикой партий.**
Монорепа из четырёх независимых пакетов, каждый качает свой кусок: рендер, мозги, бэкенд и UI.

```
┌──────────────┐   ┌─────────────┐   ┌──────────────┐   ┌───────────────┐
│  @chess-ai/  │   │ @chess-ai/  │   │ @chess-ai/   │   │ @chess-ai/    │
│   design     │◀──│  frontend   │──▶│  engine      │   │   backend     │
│  (Three.js)  │   │  (Vue 3)    │   │ (Web Worker) │   │ (Express+SQL) │
└──────────────┘   └─────────────┘   └──────────────┘   └───────────────┘
       3D                SPA              минимакс            REST + Elo
```

Контракты между пакетами — в `SHARED_CONTRACTS.md` (FEN/UCI, типы DTO, события 3D-сцены).

---

## 🚀 Quick start (одна команда)

```bash
npm install
npm run dev
```

`npm install` поднимает все workspaces сразу. `npm run dev` через `concurrently` стартует Express на `:4000` и Vite на `:5173` параллельно, открывает браузер. Фронт проксирует `/api` на бэк, Vite-алиасы тянут `@chess-ai/design` и `@chess-ai/engine` прямо из исходников — никаких build-шагов между пакетами.

**Требования:** Node 18+. `better-sqlite3` собирает нативный биндинг на установке; на Windows нужны build tools (обычно идут с Node-установщиком; если нет — VS Build Tools).

---

## 📦 Packages

### `ai-engine/` — `@chess-ai/engine`

TypeScript-движок, который реально умеет играть. Не обёртка над Stockfish — собственная реализация.

- **Поиск:** minimax + alpha-beta pruning + iterative deepening
- **Quiescence search** — добивает тактические последовательности (взятия/шахи) за пределами основной глубины, чтобы не висеть в horizon effect
- **Move ordering:** MVV-LVA + killer moves + history heuristic — отсечения работают на порядок эффективнее
- **Оценка позиции:** материал + piece-square tables (PST) с разделением middlegame/endgame, мобильность, структура пешек, безопасность короля
- **Opening book** — короткая база дебютов на первые ходы, чтобы движок не лез в чудеса с 1.a4
- **5 уровней сложности** (`beginner` → `master`): разная глубина + дозированный шум случайных ходов для слабых уровней
- **Web Worker-ready** — фронт спавнит движок в отдельном потоке, UI не лагает во время раздумий

```ts
const engine = createEngine();
await engine.init();
const move = await engine.getBestMove(fen, 'master');
// { from, to, promotion?, evaluation, depthReached, nodesSearched }
```

Тесты: `npm test --workspace=@chess-ai/engine`.

---

### `design/` — `@chess-ai/design`

3D-доска на чистом Three.js. Без `react-three-fiber`, без готовых ассетов — всё процедурно.

- **Процедурная генерация фигур** — пешки, кони, слоны, ладьи, ферзи и короли строятся из примитивов Three.js, без `.glb`-моделей
- **Три темы:** `classic` (дерево), `neon` (киберпанк со свечением), `glass` (прозрачные фигуры с преломлением)
- **GSAP-анимации:**
  - плавный glide фигур с easing
  - capture explosion (взрыв частиц при взятии)
  - check pulse (пульсация короля при шахе)
  - checkmate — camera shake + медленный zoom-in
  - синхронизированная рокировка (король + ладья в один beat)
  - promotion — вертикальный лифт + вспышка
- **Particle effects** на отдельной системе — для взятий и матов
- **Highlight squares** трёх типов: легальные ходы, последний ход, шах
- **Чистый API** (см. `SHARED_CONTRACTS.md`): `setBoardState(fen)`, `highlightSquares`, `setTheme`, `on('squareClick' | 'move' | 'animationEnd')`

Демо: `npm run dev --workspace=@chess-ai/design` → http://localhost:5174.

---

### `backend/` — `@chess-ai/backend`

Node.js + Express + better-sqlite3. Синхронный SQLite — на этих объёмах быстрее любого async-драйвера, без callback-ада.

- **REST API:** игроки, партии, аналитика (полный список — в `SHARED_CONTRACTS.md`)
- **Elo-рейтинг** с K=32 — пересчёт после каждой сыгранной партии
- **Хранение партий:** PGN + полная FEN-history → можно прокрутить любую партию покадрово
- **Аналитика на сервисном слое:**
  - winrate, средняя длина ходов, любимые дебюты по ECO
  - leaderboard top-N
  - global stats: winrate AI по уровню сложности
- **CORS открыт для localhost**, нативный SQLite-файл лежит в `backend/data/`
- **Схема в SQL-файле** (`db/schema.sql`), а не в ORM — миграции читаются глазами

Старт отдельно: `npm run dev --workspace=@chess-ai/backend` (порт 4000).

---

### `frontend/` — `@chess-ai/frontend`

Vue 3 + Vuex 4 + Vite. Склейка всего стека.

- **5 страниц:** `/` (лобби), `/play` (игра), `/history`, `/analytics/:playerId`, `/leaderboard`
- **Vuex-модули:** `board`, `game`, `ai`, `analytics`, `player` — состояние шахмат отдельно от состояния UI
- **AI в Web Worker** — движок спавнится через `frontend/src/workers/`, главный поток не блокируется
- **Компоненты:**
  - `Board3DHost.vue` — монтирует 3D-сцену из `@chess-ai/design`
  - `EvalBar.vue` — реалтайм-оценка позиции из движка
  - `MoveList.vue` — список ходов в SAN
  - `CapturedPieces.vue` — взятые фигуры с обеих сторон
  - `PromotionDialog.vue` — выбор фигуры при превращении пешки
  - `Timers.vue`, `ThemePicker.vue`, `DifficultyPicker.vue`
  - `charts/` — графики аналитики игрока
- **Валидация ходов** через `chess.js` локально, чтобы не гонять каждый ход на бэк
- **Сохранение партии** на бэк только по окончании (мат/пат/сдача) — не засоряем БД промежуточным состоянием

Старт отдельно: `npm run dev --workspace=@chess-ai/frontend` (порт 5173).

---

## 🗂 Структура монорепы

```
chess-ai/
├── ai-engine/      # движок (search, eval, book, ordering, worker)
├── design/         # Three.js сцена (board, pieces, themes, animations, effects)
├── backend/        # Express + SQLite (routes, services, db)
├── frontend/       # Vue 3 SPA (views, components, store, workers)
├── SHARED_CONTRACTS.md   # API-контракты между пакетами
├── package.json    # npm workspaces + concurrently dev
└── README.md
```

## 🛠 Скрипты корня

| Команда           | Что делает                                           |
|-------------------|------------------------------------------------------|
| `npm run dev`     | Backend + frontend параллельно, kill-others-on-fail  |
| `npm run build`   | Билд всех workspaces, у кого есть `build`            |
| `npm test`        | Прогон тестов во всех workspaces                     |
| `npm start`       | Алиас на `npm run dev`                               |

## 🧱 Технологии

| Слой       | Стек                                                    |
|------------|---------------------------------------------------------|
| 3D         | Three.js, GSAP                                          |
| Frontend   | Vue 3, Vuex 4, Vite, chess.js, TypeScript               |
| AI         | TypeScript, Web Worker, alpha-beta minimax              |
| Backend    | Node.js, Express, better-sqlite3                        |
| Общее      | ESM, TypeScript, npm workspaces                         |
