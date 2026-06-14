<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useStore } from '@/store';
import Board3DHost from '@/components/Board3DHost.vue';
import MoveList from '@/components/MoveList.vue';
import EvalBar from '@/components/EvalBar.vue';
import CapturedPieces from '@/components/CapturedPieces.vue';
import Timers from '@/components/Timers.vue';
import PromotionDialog from '@/components/PromotionDialog.vue';
import MusicControl from '@/components/MusicControl.vue';
import type { StructuredMove, MoveValidator } from '@/types/shared';
import { Chess } from 'chess.js';
import { t } from '@/i18n';

const store = useStore();
const router = useRouter();

const game = computed(() => store.state.game);
const board = computed(() => store.state.board);
const ai = computed(() => store.state.ai);

const pendingPromotion = ref<StructuredMove | null>(null);
const showPromotion = ref(false);

// Move validator for the 3D board - validates moves against chess.js
// Uses a function-based approach to always get fresh state
const moveValidator = {
  isLegal(from: string, to: string): boolean {
    try {
      const fen = store.state.game.fen;
      const chess = new Chess(fen);
      const moves = chess.moves({ square: from as never, verbose: true });
      return moves.some(m => m.to === to);
    } catch {
      return false;
    }
  },
  getLegalMoves(square: string): string[] {
    try {
      const fen = store.state.game.fen;
      const chess = new Chess(fen);
      const moves = chess.moves({ square: square as never, verbose: true });
      return moves.map(m => m.to);
    } catch {
      return [];
    }
  }
};

// Guard: if no active game, send back to lobby.
onMounted(() => {
  if (game.value.status === 'idle') {
    void router.replace('/');
  } else {
    // Only initialize AI in AI mode
    if (game.value.gameMode === 'ai') {
      void store.dispatch('ai/init');
      triggerAiIfNeeded();
    }
  }
});

function isPromotion(m: StructuredMove): boolean {
  const c = new Chess(game.value.fen);
  const piece = c.get(m.from as never);
  if (!piece || piece.type !== 'p') return false;
  const lastRank = piece.color === 'w' ? '8' : '1';
  return m.to.endsWith(lastRank);
}

async function attemptMove(m: StructuredMove): Promise<void> {
  if (
    game.value.status !== 'playing' &&
    game.value.status !== 'check'
  ) {
    return;
  }
  // In hotseat mode, both players can move. In AI mode, only the player's turn.
  if (game.value.gameMode === 'ai' && game.value.turn !== game.value.playerColor) return;
  if (isPromotion(m) && !m.promotion) {
    pendingPromotion.value = m;
    showPromotion.value = true;
    return;
  }
  const ok = await store.dispatch('game/move', m);
  if (ok) {
    store.commit('board/setHighlights', {
      squares: [m.from, m.to],
      kind: 'last-move',
    });
    await afterMove();
  } else {
    // Illegal move — reset any in-progress selection so the next click starts fresh,
    // and clear the error banner shortly so it doesn't linger.
    store.commit('board/clearHighlights');
    scheduleErrorDismiss();
  }
}

let errorDismissTimer: ReturnType<typeof setTimeout> | null = null;
function scheduleErrorDismiss(): void {
  if (errorDismissTimer) clearTimeout(errorDismissTimer);
  errorDismissTimer = setTimeout(() => {
    store.commit('game/setError', null);
    errorDismissTimer = null;
  }, 2000);
}

function pickPromotion(piece: 'q' | 'r' | 'b' | 'n'): void {
  if (!pendingPromotion.value) return;
  const m = { ...pendingPromotion.value, promotion: piece };
  showPromotion.value = false;
  pendingPromotion.value = null;
  void attemptMove(m);
}

function cancelPromotion(): void {
  pendingPromotion.value = null;
  showPromotion.value = false;
}

async function afterMove(): Promise<void> {
  if (store.getters['game/isGameOver']) {
    await store.dispatch('game/saveToBackend');
    return;
  }
  // Only trigger AI in AI mode
  if (game.value.gameMode === 'ai') {
    triggerAiIfNeeded();
  }
}

async function triggerAiIfNeeded(): Promise<void> {
  if (
    game.value.status === 'idle' ||
    store.getters['game/isGameOver']
  ) {
    return;
  }
  if (game.value.turn === game.value.playerColor) return;
  const res = await store.dispatch('ai/requestMove', {
    fen: game.value.fen,
    difficulty: game.value.aiDifficulty,
  });
  if (res) {
    const ok = await store.dispatch('game/move', {
      from: res.from,
      to: res.to,
      promotion: res.promotion,
    });
    if (ok) {
      store.commit('board/setHighlights', {
        squares: [res.from, res.to],
        kind: 'last-move',
      });
      if (store.getters['game/isGameOver']) {
        await store.dispatch('game/saveToBackend');
      }
    }
  }
}

function onSquareClick(sq: string): void {
  const moves = store.getters['game/legalMovesFrom'](sq) as string[];
  if (moves.length === 0) {
    store.commit('board/clearHighlights');
    return;
  }
  store.commit('board/setHighlights', {
    squares: moves,
    kind: 'legal',
  });
}

// Confirm flow
const pendingMove = ref<StructuredMove | null>(null);
const showConfirm = ref(false);

function onMoveSelected(m: StructuredMove): void {
  pendingMove.value = m;
  showConfirm.value = true;
}

function confirmMove(): void {
  if (!pendingMove.value) return;
  void attemptMove(pendingMove.value);
  pendingMove.value = null;
  showConfirm.value = false;
}

function cancelMove(): void {
  pendingMove.value = null;
  showConfirm.value = false;
  store.commit('board/clearHighlights');
}

function undoMove(): void {
  if (game.value.moveHistory.length === 0) return;
  if (game.value.gameMode === 'ai') {
    if (game.value.turn === game.value.playerColor && game.value.moveHistory.length >= 2) {
      store.dispatch('game/undo');
      store.dispatch('game/undo');
    } else if (game.value.turn !== game.value.playerColor && game.value.moveHistory.length >= 1) {
      store.dispatch('game/undo');
    }
  } else {
    store.dispatch('game/undo');
  }
}

function resign(): void {
  store.dispatch('game/resign');
  void store.dispatch('game/saveToBackend');
}

function offerDraw(): void {
  // Single-player: AI accepts deterministically for the demo.
  store.dispatch('game/draw');
  void store.dispatch('game/saveToBackend');
}

watch(
  () => game.value.fen,
  () => {
    if (game.value.lastMove) {
      void store.dispatch('ai/evaluate', game.value.fen);
    }
  },
);
</script>

<template>
  <section class="game-view">
    <aside class="left">
      <EvalBar />
    </aside>
    <div class="center">
      <Board3DHost
        :fen="game.fen"
        :theme="board.theme"
        :animation-speed="board.animationSpeed"
        :highlights="board.highlightedSquares"
        :highlight-kind="board.highlightKind"
        :battle-mode="board.battleMode"
        :move-validator="moveValidator"
        @move="onMoveSelected"
        @square-click="onSquareClick"
      />
      <div class="move-confirm" v-if="showConfirm && pendingMove">
        <span class="confirm-text">
          {{ pendingMove.from }} → {{ pendingMove.to }}
        </span>
        <button class="confirm-btn yes" @click="confirmMove">{{ t('game.confirm') }}</button>
        <button class="confirm-btn no" @click="cancelMove">{{ t('game.cancel') }}</button>
      </div>
      <div class="turn-indicator" v-if="game.status === 'playing' || game.status === 'check'">
        <span :class="['turn-dot', game.turn]"></span>
        <span>{{ game.turn === 'w' ? t('game.whiteToMove') : t('game.blackToMove') }}</span>
        <span v-if="game.gameMode === 'hotseat'" class="hotseat-badge">Hotseat</span>
      </div>
      <div v-if="ai.thinking" class="thinking">{{ t('game.thinking') }}</div>
      <div v-if="game.error" class="error">{{ game.error }}</div>
      <div v-if="store.getters['game/isGameOver']" class="result">
        {{ t('game.result') }}: <strong>{{ game.result }}</strong>
        <button class="link" @click="router.push('/')">{{ t('game.backToLobby') }}</button>
      </div>
    </div>
    <aside class="right">
      <MusicControl />
      <Timers />
      <CapturedPieces />
      <MoveList />
      <div class="actions">
        <button @click="undoMove" :disabled="store.getters['game/isGameOver'] || game.moveHistory.length === 0">
          {{ t('game.undo') }}
        </button>
        <button @click="offerDraw" :disabled="store.getters['game/isGameOver']">
          {{ t('game.offerDraw') }}
        </button>
        <button
          class="danger"
          @click="resign"
          :disabled="store.getters['game/isGameOver']"
        >
          {{ t('game.resign') }}
        </button>
      </div>
    </aside>

    <PromotionDialog
      :open="showPromotion"
      :color="game.playerColor"
      @pick="pickPromotion"
      @cancel="cancelPromotion"
    />
  </section>
</template>

<style scoped>
.game-view {
  display: grid;
  grid-template-columns: 40px 1fr 320px;
  gap: 1rem;
  align-items: start;
}
.left {
  height: 100%;
  display: flex;
  justify-content: center;
}
.center {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}
.right {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}
.thinking {
  color: var(--text-muted);
  font-size: 0.85rem;
}
.move-confirm {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  background: var(--surface-1);
  border: 1px solid var(--accent);
  border-radius: 6px;
}
.confirm-text {
  font-family: monospace;
  font-size: 0.9rem;
  color: var(--text);
}
.confirm-btn {
  padding: 0.3rem 0.6rem;
  border: 1px solid var(--border);
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.85rem;
}
.confirm-btn.yes {
  background: #2d5a2d;
  color: #aaffaa;
  border-color: #4a8a4a;
}
.confirm-btn.no {
  background: #5a2d2d;
  color: #ffaaaa;
  border-color: #8a4a4a;
}
.turn-indicator {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  background: var(--surface-1);
  border-radius: 6px;
  font-size: 0.9rem;
}
.turn-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  border: 2px solid var(--border);
}
.turn-dot.w {
  background: #fff;
}
.turn-dot.b {
  background: #333;
}
.hotseat-badge {
  margin-left: auto;
  padding: 0.15rem 0.5rem;
  background: var(--accent);
  color: #061018;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 600;
}
.error {
  background: #3a1e1e;
  color: #fca5a5;
  padding: 0.5rem 0.75rem;
  border-radius: 6px;
  font-size: 0.85rem;
}
.result {
  background: var(--surface-1);
  padding: 0.75rem 1rem;
  border-radius: 6px;
  display: flex;
  align-items: center;
  gap: 1rem;
}
.actions {
  display: flex;
  gap: 0.5rem;
}
.actions button {
  flex: 1;
  padding: 0.5rem 0.75rem;
  background: var(--surface-1);
  border: 1px solid var(--border);
  border-radius: 6px;
  color: var(--text);
  cursor: pointer;
}
.actions .danger {
  border-color: #b94545;
  color: #fca5a5;
}
.link {
  background: transparent;
  border: none;
  color: var(--accent);
  text-decoration: underline;
  cursor: pointer;
}
@media (max-width: 960px) {
  .game-view {
    grid-template-columns: 1fr;
  }
  .left {
    display: none;
  }
}
</style>
