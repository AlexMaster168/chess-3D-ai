<script setup lang="ts">
import { computed, onMounted } from 'vue';
import { useStore } from '@/store';
import { useRouter } from 'vue-router';

const store = useStore();
const router = useRouter();

const rows = computed(() => store.state.analytics.leaderboard);
const loading = computed(() => store.state.analytics.loading);
const error = computed(() => store.state.analytics.error);
const global = computed(() => store.state.analytics.global);

onMounted(() => {
  void store.dispatch('analytics/fetchLeaderboard', 20);
  void store.dispatch('analytics/fetchGlobal');
});

function openPlayer(id: string): void {
  void router.push(`/analytics/${id}`);
}
</script>

<template>
  <section class="leaderboard">
    <h1>Leaderboard</h1>
    <div v-if="loading" class="muted">Loading…</div>
    <div v-if="error" class="error">{{ error }}</div>

    <div v-if="global" class="global">
      <div class="stat">
        <span>Total games</span>
        <strong>{{ global.totalGames }}</strong>
      </div>
      <div class="stat">
        <span>Total players</span>
        <strong>{{ global.totalPlayers }}</strong>
      </div>
      <div class="stat">
        <span>Avg game length</span>
        <strong>{{ Math.round(global.avgGameLengthSec / 60) }}m</strong>
      </div>
    </div>

    <table v-if="rows.length > 0">
      <thead>
        <tr>
          <th>#</th>
          <th>Player</th>
          <th>Rating</th>
          <th>W</th>
          <th>L</th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="(r, i) in rows"
          :key="r.playerId"
          @click="openPlayer(r.playerId)"
        >
          <td>{{ i + 1 }}</td>
          <td>{{ r.name }}</td>
          <td>{{ r.rating }}</td>
          <td>{{ r.wins }}</td>
          <td>{{ r.losses }}</td>
        </tr>
      </tbody>
    </table>
    <p v-else-if="!loading" class="muted">No data yet.</p>
  </section>
</template>

<style scoped>
.leaderboard h1 {
  margin-top: 0;
}
.global {
  display: flex;
  gap: 1rem;
  margin-bottom: 1rem;
}
.stat {
  flex: 1;
  background: var(--surface-1);
  border: 1px solid var(--border);
  border-radius: 6px;
  padding: 0.75rem;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}
.stat span {
  color: var(--text-muted);
  font-size: 0.8rem;
  text-transform: uppercase;
}
.stat strong {
  font-size: 1.4rem;
}
table {
  width: 100%;
  border-collapse: collapse;
  background: var(--surface-1);
  border: 1px solid var(--border);
  border-radius: 6px;
  overflow: hidden;
}
th,
td {
  padding: 0.5rem 0.75rem;
  text-align: left;
}
th {
  background: var(--surface-2);
  color: var(--text-muted);
  font-weight: 500;
  font-size: 0.8rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
tbody tr:hover {
  background: var(--surface-2);
  cursor: pointer;
}
.muted {
  color: var(--text-muted);
}
.error {
  color: #fca5a5;
}
</style>
