<script setup lang="ts">
import { computed } from 'vue';
import { useStore } from '@/store';
import { t } from '@/i18n';

const store = useStore();

interface MoveEntry {
  index: number;
  white: { san: string; icon: string; from: string; to: string } | null;
  black: { san: string; icon: string; from: string; to: string } | null;
}

const PIECE_ICONS: Record<string, string> = {
  p: '♟', n: '♞', b: '♝', r: '♜', q: '♛', k: '♚',
  P: '♙', N: '♘', B: '♗', R: '♖', Q: '♕', K: '♔',
};

function getIcon(san: string): string {
  // Extract piece from SAN (first char if uppercase)
  const pieceChar = san.charAt(0);
  if (PIECE_ICONS[pieceChar]) return PIECE_ICONS[pieceChar];
  // Pawn move (no piece prefix)
  return '♟';
}

function formatMove(san: string, move: any): { san: string; icon: string; from: string; to: string } {
  return {
    san,
    icon: getIcon(san),
    from: move?.from ?? '',
    to: move?.to ?? '',
  };
}

const pairs = computed<MoveEntry[]>(() => {
  const moves = store.state.game.moveHistory;
  const out: MoveEntry[] = [];
  for (let i = 0; i < moves.length; i += 2) {
    out.push({
      index: Math.floor(i / 2) + 1,
      white: moves[i] ? formatMove(moves[i].san, moves[i]) : null,
      black: moves[i + 1] ? formatMove(moves[i + 1].san, moves[i + 1]) : null,
    });
  }
  return out;
});
</script>

<template>
  <section class="move-list">
    <header>{{ t('game.moves') }}</header>
    <ol>
      <li v-for="p in pairs" :key="p.index">
        <span class="num">{{ p.index }}.</span>
        <span class="move white" v-if="p.white">
          <span class="icon">{{ p.white.icon }}</span>
          <span class="notation">{{ p.white.from }}→{{ p.white.to }}</span>
          <span class="san">{{ p.white.san }}</span>
        </span>
        <span class="move black" v-if="p.black">
          <span class="icon">{{ p.black.icon }}</span>
          <span class="notation">{{ p.black.from }}→{{ p.black.to }}</span>
          <span class="san">{{ p.black.san }}</span>
        </span>
      </li>
      <li v-if="pairs.length === 0" class="empty">{{ t('game.noMoves') }}</li>
    </ol>
  </section>
</template>

<style scoped>
.move-list {
  background: var(--surface-1);
  border-radius: 6px;
  padding: 0.5rem 0.75rem;
  font-size: 0.8rem;
  max-height: 320px;
  overflow-y: auto;
}
header {
  font-weight: 600;
  margin-bottom: 0.5rem;
  color: var(--text-muted);
  text-transform: uppercase;
  font-size: 0.7rem;
  letter-spacing: 0.08em;
}
ol {
  list-style: none;
  margin: 0;
  padding: 0;
}
li {
  display: grid;
  grid-template-columns: 2rem 1fr 1fr;
  gap: 0.25rem;
  padding: 0.15rem 0;
  border-bottom: 1px solid var(--border);
}
li:last-child {
  border-bottom: none;
}
.num {
  color: var(--text-muted);
}
.move {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-family: 'JetBrains Mono', monospace;
}
.icon {
  font-size: 1rem;
}
.notation {
  color: var(--text);
  font-size: 0.75rem;
}
.san {
  color: var(--accent);
  font-weight: 500;
}
.move.white .icon {
  color: #f0e6d0;
  text-shadow: 0 0 2px #000;
}
.move.black .icon {
  color: #3a2a1a;
  text-shadow: 0 0 2px #fff;
}
.empty {
  display: block;
  color: var(--text-muted);
  font-style: italic;
  grid-column: 1 / -1;
}
</style>
