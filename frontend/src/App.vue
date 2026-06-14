<script setup lang="ts">
import { RouterLink, RouterView } from 'vue-router';
import { useStore } from './store';
import { computed } from 'vue';
import { t } from './i18n';

const store = useStore();
const player = computed(() => store.state.player.current);
</script>

<template>
  <div class="app-shell">
    <header class="app-header">
      <RouterLink to="/" class="brand">{{ t('app.title') }}</RouterLink>
      <nav class="nav">
        <RouterLink to="/">{{ t('lobby.newGame') }}</RouterLink>
        <RouterLink to="/play">{{ t('lobby.startGame') }}</RouterLink>
        <RouterLink to="/history">History</RouterLink>
        <RouterLink
          v-if="player"
          :to="`/analytics/${player.id}`"
        >Analytics</RouterLink>
        <RouterLink to="/leaderboard">Leaderboard</RouterLink>
        <RouterLink to="/settings">⚙️</RouterLink>
      </nav>
      <div class="player-pill" v-if="player">
        <span>{{ player.name }}</span>
        <small>{{ player.rating }}</small>
      </div>
    </header>
    <main class="app-main">
      <RouterView />
    </main>
  </div>
</template>

<style scoped>
.app-shell {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}
.app-header {
  display: flex;
  gap: 1.5rem;
  align-items: center;
  padding: 0.75rem 1.5rem;
  background: var(--surface-1);
  border-bottom: 1px solid var(--border);
}
.brand {
  font-weight: 700;
  font-size: 1.1rem;
  color: var(--accent);
  text-decoration: none;
}
.nav {
  display: flex;
  gap: 1rem;
  flex: 1;
}
.nav a {
  color: var(--text-muted);
  text-decoration: none;
  font-size: 0.9rem;
}
.nav a.router-link-exact-active {
  color: var(--text);
  border-bottom: 2px solid var(--accent);
}
.player-pill {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  font-size: 0.85rem;
}
.player-pill small {
  color: var(--text-muted);
}
.app-main {
  flex: 1;
  padding: 1.5rem;
}
</style>
