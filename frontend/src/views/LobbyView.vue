<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useStore } from '@/store';
import DifficultyPicker from '@/components/DifficultyPicker.vue';
import ThemePicker from '@/components/ThemePicker.vue';
import type { BoardTheme, Color, Difficulty } from '@/types/shared';

const store = useStore();
const router = useRouter();

const name = ref(store.state.player.current?.name ?? '');
const difficulty = ref<Difficulty>(store.state.game.aiDifficulty);
const theme = ref<BoardTheme>(store.state.board.theme);
const color = ref<Color>(store.state.game.playerColor);
const submitting = ref(false);

onMounted(() => {
  void store.dispatch('player/loadFromStorage');
});

async function startGame(): Promise<void> {
  if (!name.value.trim()) return;
  submitting.value = true;
  try {
    if (!store.state.player.current || store.state.player.current.name !== name.value) {
      await store.dispatch('player/register', name.value.trim());
    }
    store.commit('board/setTheme', theme.value);
    store.dispatch('game/newGame', {
      color: color.value,
      difficulty: difficulty.value,
    });
    await store.dispatch('ai/init');
    await router.push('/play');
  } finally {
    submitting.value = false;
  }
}
</script>

<template>
  <section class="lobby">
    <h1>New Game</h1>
    <div class="grid">
      <label class="field">
        <span>Your name</span>
        <input v-model="name" type="text" placeholder="e.g. Magnus" />
      </label>

      <fieldset class="picker">
        <legend>Play as</legend>
        <div class="row">
          <button
            type="button"
            :class="{ selected: color === 'w' }"
            @click="color = 'w'"
          >White</button>
          <button
            type="button"
            :class="{ selected: color === 'b' }"
            @click="color = 'b'"
          >Black</button>
        </div>
      </fieldset>

      <DifficultyPicker v-model="difficulty" />
      <ThemePicker v-model="theme" />

      <button
        class="primary"
        :disabled="!name.trim() || submitting"
        @click="startGame"
      >
        {{ submitting ? 'Starting…' : 'Start game' }}
      </button>
    </div>
  </section>
</template>

<style scoped>
.lobby {
  max-width: 540px;
  margin: 0 auto;
}
h1 {
  margin: 0 0 1rem;
}
.grid {
  display: grid;
  gap: 1rem;
}
.field {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}
.field span {
  font-size: 0.8rem;
  color: var(--text-muted);
}
input {
  padding: 0.5rem 0.75rem;
  background: var(--surface-1);
  border: 1px solid var(--border);
  border-radius: 6px;
  color: var(--text);
  font-size: 1rem;
}
.picker {
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 0.75rem 1rem;
}
.picker legend {
  padding: 0 0.4rem;
  color: var(--text-muted);
  font-size: 0.8rem;
}
.row {
  display: flex;
  gap: 0.5rem;
}
.row button {
  flex: 1;
  background: var(--surface-1);
  color: var(--text);
  border: 1px solid var(--border);
  border-radius: 6px;
  padding: 0.5rem 0.75rem;
  cursor: pointer;
}
.row button.selected {
  border-color: var(--accent);
  background: var(--surface-2);
}
.primary {
  padding: 0.75rem 1rem;
  background: var(--accent);
  color: #061018;
  border: none;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
}
.primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
