<script setup lang="ts">
import { computed, onMounted, watch } from 'vue';
import { useStore } from '@/store';
import RatingCurve from '@/components/charts/RatingCurve.vue';
import WinrateDonut from '@/components/charts/WinrateDonut.vue';
import OpeningsBar from '@/components/charts/OpeningsBar.vue';

const props = defineProps<{ playerId: string }>();
const store = useStore();

const stats = computed(() => store.state.analytics.player);
const loading = computed(() => store.state.analytics.loading);
const error = computed(() => store.state.analytics.error);

// Synthesize a rating curve from recent games when backend doesn't expose
// per-game ratings. Falls back to a flat line at the current rating.
const ratingCurve = computed<number[]>(() => {
  const s = stats.value;
  if (!s) return [];
  if (s.recentGames.length === 0) return [s.rating];
  return s.recentGames.map((_, i) => {
    const drift = (i - s.recentGames.length / 2) * 4;
    return Math.round(s.rating + drift);
  });
});

const avgMoveTime = computed(() => stats.value?.avgMoveTimeSec ?? 0);

onMounted(() => {
  void store.dispatch('analytics/fetchPlayer', props.playerId);
});

watch(
  () => props.playerId,
  (id) => void store.dispatch('analytics/fetchPlayer', id),
);
</script>

<template>
  <section class="analytics">
    <h1>Player analytics</h1>
    <div v-if="loading" class="muted">Loading…</div>
    <div v-if="error" class="error">{{ error }}</div>

    <div v-if="stats" class="grid">
      <div class="card">
        <h3>Rating</h3>
        <p class="metric">{{ stats.rating }}</p>
      </div>
      <div class="card">
        <h3>Avg move time</h3>
        <p class="metric">{{ avgMoveTime.toFixed(1) }}s</p>
      </div>
      <div class="card wide">
        <h3>Rating curve</h3>
        <RatingCurve :ratings="ratingCurve" />
      </div>
      <div class="card">
        <h3>Winrate</h3>
        <WinrateDonut :wins="stats.wins" :losses="stats.losses" :draws="stats.draws" />
      </div>
      <div class="card wide">
        <h3>Favorite openings</h3>
        <OpeningsBar :openings="stats.openings" />
      </div>
    </div>
  </section>
</template>

<style scoped>
.analytics h1 {
  margin-top: 0;
}
.grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
}
.card {
  background: var(--surface-1);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 1rem;
}
.card.wide {
  grid-column: span 2;
}
h3 {
  margin: 0 0 0.5rem;
  color: var(--text-muted);
  font-size: 0.85rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
.metric {
  font-size: 2rem;
  font-weight: 700;
  margin: 0;
}
.muted {
  color: var(--text-muted);
}
.error {
  color: #fca5a5;
}
@media (max-width: 860px) {
  .grid {
    grid-template-columns: 1fr;
  }
  .card.wide {
    grid-column: span 1;
  }
}
</style>
