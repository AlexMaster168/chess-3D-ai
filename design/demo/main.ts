import { createBoard, STARTING_FEN, type ChessBoard3D, type AnimationSpeed, type ThemeName } from '@chess-ai/design';

const stage = document.getElementById('stage') as HTMLElement;
const logEl = document.getElementById('log') as HTMLElement;

function log(...args: unknown[]): void {
  const line = args
    .map(a => (typeof a === 'string' ? a : JSON.stringify(a)))
    .join(' ');
  const ts = new Date().toLocaleTimeString();
  logEl.textContent = `[${ts}] ${line}\n` + logEl.textContent;
  if (logEl.textContent.length > 4000) {
    logEl.textContent = logEl.textContent.slice(0, 4000);
  }
}

const board: ChessBoard3D = createBoard();

// A few sample positions to swap between.
const POSITIONS = {
  start: STARTING_FEN,
  // After 1. e4 e5
  e4e5: 'rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq e6 0 2',
  // Italian Game-ish: 1. e4 e5 2. Nf3 Nc6 3. Bc4 Bc5
  italian: 'r1bqk1nr/pppp1ppp/2n5/2b1p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 0 4',
  // White king castled kingside (g1/f1), black king still home
  castledShort: 'rnbqk1nr/pppp1ppp/8/4p3/4P3/5N2/PPPP1PPP/RNBQ1RK1 b kq - 0 1',
  // Promotion-ish: white pawn on e8 as queen
  promoted: 'rnbqkbnr/pppppppp/8/8/8/8/PPP1PPPP/RNBQKBNR w KQkq - 0 1'
};

const SPEEDS: AnimationSpeed[] = ['slow', 'normal', 'fast'];
let speedIdx = 1;

let lastSelected: string | null = null;

(async () => {
  await board.mount(stage);
  board.setBoardState(POSITIONS.start, false);
  log('Board mounted. Starting position loaded.');

  board.on('squareClick', sq => {
    log('squareClick:', sq);
    if (lastSelected === null) {
      lastSelected = sq;
      board.highlightSquares([sq], 'legal');
    } else {
      board.highlightSquares([], 'legal');
      lastSelected = null;
    }
  });
  board.on('move', m => log('move:', m));
  board.on('animationEnd', kind => log('animationEnd:', kind));

  window.addEventListener('keydown', e => {
    const key = e.key.toLowerCase();
    switch (key) {
      case '1':
        board.setTheme('classic');
        log('theme: classic');
        break;
      case '2':
        board.setTheme('neon');
        log('theme: neon');
        break;
      case '3':
        board.setTheme('glass');
        log('theme: glass');
        break;
      case 'r':
        board.setBoardState(POSITIONS.start, false);
        log('reset to starting FEN');
        break;
      case 'm':
        // Animated transition into 1.e4 e5
        board.setBoardState(POSITIONS.e4e5, true);
        log('sample move: 1. e4 e5');
        break;
      case 'c': {
        // Force a capture by animating to italian (involves moves and a Nc3xNc6-style position)
        board.setBoardState(POSITIONS.italian, true);
        log('capture demo: progressing to Italian setup (animated)');
        break;
      }
      case 'k':
        board.playEffect('check');
        log('check effect on tracked king');
        break;
      case 'x':
        board.playEffect('checkmate');
        log('checkmate cinematic');
        break;
      case 's':
        if (e.shiftKey) {
          speedIdx = (speedIdx + 1) % SPEEDS.length;
          const s = SPEEDS[speedIdx];
          board.setAnimationSpeed(s);
          log('speed:', s);
        } else {
          board.setBoardState(POSITIONS.castledShort, true);
          log('castling animation (kingside)');
        }
        break;
      case 'p':
        // Promotion demo: snap to a position and play promotion effect on king square (visual only).
        board.setBoardState(POSITIONS.promoted, true);
        log('promotion demo (visual setup)');
        break;
      case 'h':
        board.highlightSquares(['e2', 'e4', 'd4', 'f4', 'e3'], 'legal');
        log('highlight legal squares');
        break;
      case 'l':
        board.highlightSquares(['e2', 'e4'], 'last-move');
        log('highlight last-move (e2->e4)');
        break;
      default:
        return;
    }
  });

  // Theme cycle on triple-click of stage (extra delight).
  const themeCycle: ThemeName[] = ['classic', 'neon', 'glass'];
  let themeIdx = 0;
  let clickCount = 0;
  let clickTimer: number | null = null;
  stage.addEventListener('click', () => {
    clickCount++;
    if (clickTimer) window.clearTimeout(clickTimer);
    clickTimer = window.setTimeout(() => (clickCount = 0), 400);
    if (clickCount >= 3) {
      themeIdx = (themeIdx + 1) % themeCycle.length;
      board.setTheme(themeCycle[themeIdx]);
      log('theme (3-click cycle):', themeCycle[themeIdx]);
      clickCount = 0;
    }
  });
})().catch(err => {
  log('mount error:', String(err));
  // eslint-disable-next-line no-console
  console.error(err);
});
