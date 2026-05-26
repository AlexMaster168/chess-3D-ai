<script setup lang="ts">
import { computed } from 'vue';
import { useStore } from '@/store';

const store = useStore();

interface Pair {
  index: number;
  white: string;
  black: string;
}

const pairs = computed<Pair[]>(() => {
  const moves = store.state.game.moveHistory;
  const out: Pair[] = [];
  for (let i = 0; i < moves.length; i += 2) {
    out.push({
      index: Math.floor(i / 2) + 1,
      white: moves[i]?.san ?? '',
      black: moves[i + 1]?.san ?? '',
    });
  }
  return out;
});
</script>

<template>
  <section class="move-list">
    <header>Moves</header>
    <ol>
      <li v-for="p in pairs" :key="p.index">
        <span class="num">{{ p.index }}.</span>
        <span class="san white">{{ p.white }}</span>
        <span class="san black">{{ p.black }}</span>
      </li>
      <li v-if="pairs.length === 0" class="empty">No moves yet.</li>
    </ol>
  </section>
</template>

<style scoped>
.move-list {
  background: var(--surface-1);
  border-radius: 6px;
  padding: 0.5rem 0.75rem;
  font-family: 'JetBrains Mono', monospace, ui-monospace;
  font-size: 0.85rem;
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
  gap: 0.5rem;
  padding: 0.15rem 0;
}
.num {
  color: var(--text-muted);
}
.empty {
  display: block;
  color: var(--text-muted);
  font-style: italic;
}
</style>
