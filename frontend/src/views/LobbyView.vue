<script setup lang="ts">
import { onMounted, ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useStore } from '@/store';
import DifficultyPicker from '@/components/DifficultyPicker.vue';
import ThemePicker from '@/components/ThemePicker.vue';
import BattleModePicker from '@/components/BattleModePicker.vue';
import LanguagePicker from '@/components/LanguagePicker.vue';
import type { BoardTheme, BattleMode, Color, Difficulty, GameMode } from '@/types/shared';
import type { Locale } from '@/i18n';
import { setLocale, getLocale, t } from '@/i18n';

const store = useStore();
const router = useRouter();

const name = ref(store.state.player.current?.name ?? '');
const difficulty = ref<Difficulty>(store.state.game.aiDifficulty);
const theme = ref<BoardTheme>(store.state.board.theme);
const battleMode = ref<BattleMode>(store.state.board.battleMode);
const color = ref<Color>(store.state.game.playerColor);
const gameMode = ref<GameMode>(store.state.game.gameMode);
const locale = ref<Locale>(getLocale());
const submitting = ref(false);

const isAiMode = computed(() => gameMode.value === 'ai');

function onLocaleChange(l: Locale): void {
  locale.value = l;
  setLocale(l);
}

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
    store.commit('board/setBattleMode', battleMode.value);
    store.dispatch('game/newGame', {
      color: color.value,
      difficulty: difficulty.value,
      mode: gameMode.value,
    });
    if (gameMode.value === 'ai') {
      await store.dispatch('ai/init');
    }
    await router.push('/play');
  } finally {
    submitting.value = false;
  }
}
</script>

<template>
  <section class="lobby">
    <h1>{{ t('lobby.newGame') }}</h1>
    <div class="grid">
      <label class="field">
        <span>{{ t('lobby.yourName') }}</span>
        <input v-model="name" type="text" :placeholder="t('lobby.namePlaceholder')" />
      </label>

      <LanguagePicker :model-value="locale" @update:model-value="onLocaleChange" />

      <fieldset class="picker">
        <legend>{{ t('lobby.gameMode') }}</legend>
        <div class="row">
          <button
            type="button"
            :class="{ selected: gameMode === 'ai' }"
            @click="gameMode = 'ai'"
          >
            <span class="label">{{ t('lobby.vsAI') }}</span>
            <span class="desc">{{ t('lobby.vsAIDesc') }}</span>
          </button>
          <button
            type="button"
            :class="{ selected: gameMode === 'hotseat' }"
            @click="gameMode = 'hotseat'"
          >
            <span class="label">{{ t('lobby.hotseat') }}</span>
            <span class="desc">{{ t('lobby.hotseatDesc') }}</span>
          </button>
        </div>
      </fieldset>

      <fieldset class="picker" v-if="isAiMode">
        <legend>{{ t('lobby.playAs') }}</legend>
        <div class="row">
          <button
            type="button"
            :class="{ selected: color === 'w' }"
            @click="color = 'w'"
          >{{ t('lobby.white') }}</button>
          <button
            type="button"
            :class="{ selected: color === 'b' }"
            @click="color = 'b'"
          >{{ t('lobby.black') }}</button>
        </div>
      </fieldset>

      <DifficultyPicker v-if="isAiMode" v-model="difficulty" />
      <ThemePicker v-model="theme" />
      <BattleModePicker v-model="battleMode" />

      <button
        class="primary"
        :disabled="!name.trim() || submitting"
        @click="startGame"
      >
        {{ submitting ? t('lobby.starting') : t('lobby.startGame') }}
      </button>
      <button class="secondary" @click="router.push('/settings')">
        ⚙️ {{ t('settings.title') }}
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
.secondary {
  padding: 0.75rem 1rem;
  background: var(--surface-1);
  color: var(--text);
  border: 1px solid var(--border);
  border-radius: 6px;
  font-weight: 500;
  cursor: pointer;
  width: 100%;
}
.secondary:hover {
  background: var(--surface-2);
}
</style>
