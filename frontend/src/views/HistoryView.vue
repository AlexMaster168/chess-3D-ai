<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useStore } from '@/store';
import type { Game } from '@/types/shared';

const store = useStore();
const selected = ref<Game | null>(null);

const games = computed(() => store.state.analytics.history);
const loading = computed(() => store.state.analytics.loading);
const error = computed(() => store.state.analytics.error);
const player = computed(() => store.state.player.current);

onMounted(() => {
  void store.dispatch('analytics/fetchHistory', {
    player: player.value?.id,
    limit: 50,
  });
});

function selectGame(g: Game): void {
  selected.value = g;
}

function formatDate(s: string): string {
  try {
    return new Date(s).toLocaleString();
  } catch {
    return s;
  }
}
</script>

<template>
  <section class="history">
    <h1>Game history</h1>
    <div v-if="loading" class="muted">Loading…</div>
    <div v-if="error" class="error">{{ error }}</div>
    <div v-if="!loading && games.length === 0" class="muted">
      No games yet — go play one.
    </div>
    <div class="layout" v-if="games.length > 0">
      <ul class="list">
        <li
          v-for="g in games"
          :key="g.id"
          :class="{ active: selected?.id === g.id }"
          @click="selectGame(g)"
        >
          <span class="result">{{ g.result }}</span>
          <span class="meta">{{ formatDate(g.createdAt) }}</span>
          <small>{{ g.movesCount }} moves · {{ g.aiDifficulty ?? '—' }}</small>
        </li>
      </ul>
      <article class="pgn-viewer" v-if="selected">
        <header>
          <h2>Game {{ selected.id }}</h2>
          <span>{{ selected.result }}</span>
        </header>
        <pre>{{ selected.pgn }}</pre>
      </article>
      <article class="pgn-viewer placeholder" v-else>
        Select a game on the left to view PGN.
      </article>
    </div>
  </section>
</template>

<style scoped>
.history h1 {
  margin-top: 0;
}
.layout {
  display: grid;
  grid-template-columns: 320px 1fr;
  gap: 1rem;
}
.list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  max-height: 70vh;
  overflow-y: auto;
}
.list li {
  background: var(--surface-1);
  border: 1px solid var(--border);
  border-radius: 6px;
  padding: 0.5rem 0.75rem;
  cursor: pointer;
  display: grid;
  grid-template-columns: 64px 1fr;
  gap: 0.25rem 0.75rem;
}
.list li.active {
  border-color: var(--accent);
}
.result {
  font-family: 'JetBrains Mono', monospace, ui-monospace;
  grid-row: span 2;
  display: flex;
  align-items: center;
  font-weight: 600;
}
.meta {
  font-size: 0.85rem;
}
.list small {
  color: var(--text-muted);
}
.pgn-viewer {
  background: var(--surface-1);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 1rem;
  min-height: 50vh;
}
.pgn-viewer.placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-muted);
}
.pgn-viewer pre {
  white-space: pre-wrap;
  word-break: break-word;
  font-family: 'JetBrains Mono', monospace, ui-monospace;
  font-size: 0.85rem;
}
.muted {
  color: var(--text-muted);
}
.error {
  color: #fca5a5;
}
@media (max-width: 860px) {
  .layout {
    grid-template-columns: 1fr;
  }
}
</style>
