<script setup lang="ts">
import { onMounted, onBeforeUnmount, ref, watch } from 'vue';
import type { ChessBoard3D, StructuredMove, BattleMode, MoveValidator } from '@/types/shared';
import { useStore } from '@/store';
import { Chess } from 'chess.js';

const props = defineProps<{
  fen: string;
  theme: 'classic' | 'neon' | 'glass';
  animationSpeed: 'slow' | 'normal' | 'fast';
  highlights: string[];
  highlightKind: 'legal' | 'last-move' | 'check' | null;
  battleMode?: BattleMode;
  moveValidator?: MoveValidator;
}>();

const emit = defineEmits<{
  (e: 'move', m: StructuredMove): void;
  (e: 'squareClick', sq: string): void;
  (e: 'flipBoard'): void;
}>();

const containerRef = ref<HTMLDivElement | null>(null);
const board = ref<ChessBoard3D | null>(null);
const fallback = ref(false);
const fallbackChess = ref(new Chess(props.fen));
const store = useStore();

async function tryMount(el: HTMLElement): Promise<void> {
  try {
    const mod = (await import(
      /* @vite-ignore */ '@chess-ai/design'
    )) as { createBoard?: () => ChessBoard3D };
    if (!mod.createBoard) throw new Error('createBoard missing');
    const b = mod.createBoard();
    await b.mount(el);
    b.setTheme(props.theme);
    b.setAnimationSpeed(props.animationSpeed);
    b.setBoardState(props.fen, false);
    if (props.battleMode) b.setBattleMode(props.battleMode);
    if (props.moveValidator) b.setMoveValidator(props.moveValidator);
    b.on('move', (m) => emit('move', m));
    b.on('squareClick', (sq) => emit('squareClick', sq));
    board.value = b;
    fallback.value = false;
  } catch {
    // @chess-ai/design not built yet — show 2D fallback grid.
    fallback.value = true;
  }
}

onMounted(() => {
  if (containerRef.value) void tryMount(containerRef.value);
});

onBeforeUnmount(() => {
  board.value?.unmount();
  board.value = null;
});

watch(
  () => props.fen,
  (fen) => {
    board.value?.setBoardState(fen, true);
    // Legal-move dots from the previous selection are stale the instant the
    // position changes — clear them so they don't linger next to last-move.
    board.value?.highlightSquares([], 'legal');
    if (fallback.value) fallbackChess.value = new Chess(fen);
  },
);
watch(
  () => props.theme,
  (t) => board.value?.setTheme(t),
);
watch(
  () => props.animationSpeed,
  (s) => board.value?.setAnimationSpeed(s),
);
watch(
  () => props.battleMode,
  (m) => board.value?.setBattleMode(m ?? 'classic'),
);
watch(
  () => props.moveValidator,
  (v) => board.value?.setMoveValidator(v ?? null),
);
watch(
  () => [props.highlights, props.highlightKind] as const,
  ([sq, kind]) => {
    if (kind) board.value?.highlightSquares(sq, kind);
    else board.value?.highlightSquares([]);
  },
);

function flipBoard(): void {
  board.value?.flipBoard();
  emit('flipBoard');
}

// --- 2D fallback handlers ---
const FILES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
const RANKS = [8, 7, 6, 5, 4, 3, 2, 1];

function squareName(file: number, rank: number): string {
  return `${FILES[file]}${rank}`;
}

function pieceChar(square: string): string {
  const piece = fallbackChess.value.get(square as never);
  if (!piece) return '';
  const map: Record<string, string> = {
    p: 'pawn',
    n: 'knight',
    b: 'bishop',
    r: 'rook',
    q: 'queen',
    k: 'king',
  };
  const glyphs: Record<string, string> = {
    wp: '♙',
    wn: '♘',
    wb: '♗',
    wr: '♖',
    wq: '♕',
    wk: '♔',
    bp: '♟',
    bn: '♞',
    bb: '♝',
    br: '♜',
    bq: '♛',
    bk: '♚',
  };
  const key = `${piece.color}${piece.type}`;
  return glyphs[key] ?? map[piece.type] ?? '';
}

function handleFallbackClick(square: string): void {
  emit('squareClick', square);
  const selected = store.state.board.selectedSquare;
  if (!selected) {
    store.commit('board/setSelectedSquare', square);
    return;
  }
  if (selected === square) {
    store.commit('board/setSelectedSquare', null);
    return;
  }
  emit('move', { from: selected, to: square });
  store.commit('board/setSelectedSquare', null);
}
</script>

<template>
  <div class="board-wrapper">
    <div class="board-host" ref="containerRef">
      <div v-if="fallback" class="board-2d">
        <div class="board-grid">
          <template v-for="(rank, ri) in RANKS" :key="rank">
            <div
              v-for="(file, fi) in FILES"
              :key="`${file}${rank}`"
              class="square"
              :class="{
                dark: (ri + fi) % 2 === 1,
                highlight: highlights.includes(squareName(fi, ri)),
                selected: store.state.board.selectedSquare === squareName(fi, ri),
              }"
              @click="handleFallbackClick(squareName(fi, ri))"
            >
              <span class="piece">{{ pieceChar(squareName(fi, ri)) }}</span>
            </div>
          </template>
        </div>
        <p class="fallback-note">
          3D module unavailable, showing 2D fallback.
        </p>
      </div>
    </div>
    <div class="board-controls">
      <button class="ctrl-btn" @click="flipBoard" title="Flip board">
        🔄
      </button>
    </div>
  </div>
</template>

<style scoped>
.board-wrapper {
  position: relative;
  width: 100%;
  max-width: min(85vh, 900px);
  margin: 0 auto;
}
.board-host {
  width: 100%;
  aspect-ratio: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--surface-2);
  border-radius: 8px;
  overflow: hidden;
}
.board-controls {
  position: absolute;
  bottom: -36px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 0.5rem;
}
.ctrl-btn {
  background: var(--surface-1);
  border: 1px solid var(--border);
  border-radius: 6px;
  padding: 0.3rem 0.6rem;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.2s;
}
.ctrl-btn:hover {
  background: var(--surface-2);
  border-color: var(--accent);
}
.board-2d {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  padding: 1rem;
}
.board-grid {
  display: grid;
  grid-template-columns: repeat(8, 1fr);
  grid-template-rows: repeat(8, 1fr);
  width: min(80vh, 480px);
  aspect-ratio: 1;
  border: 2px solid var(--border);
}
.square {
  display: flex;
  align-items: center;
  justify-content: center;
  background: #ead9b5;
  cursor: pointer;
  user-select: none;
  font-size: 2.2rem;
}
.square.dark {
  background: #946f4a;
}
.square.highlight {
  box-shadow: inset 0 0 0 3px var(--accent);
}
.square.selected {
  outline: 3px solid var(--accent);
  outline-offset: -3px;
}
.piece {
  pointer-events: none;
  color: #111;
  text-shadow: 0 0 2px #fff;
}
.fallback-note {
  font-size: 0.8rem;
  color: var(--text-muted);
}
</style>
