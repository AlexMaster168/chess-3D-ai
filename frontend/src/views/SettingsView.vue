<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import LanguagePicker from '@/components/LanguagePicker.vue';
import ThemePicker from '@/components/ThemePicker.vue';
import BattleModePicker from '@/components/BattleModePicker.vue';
import DifficultyPicker from '@/components/DifficultyPicker.vue';
import type { BoardTheme, BattleMode, Difficulty } from '@/types/shared';
import type { Locale } from '@/i18n';
import { setLocale, getLocale, t } from '@/i18n';
import { useStore } from '@/store';

const store = useStore();
const router = useRouter();

const locale = ref<Locale>(getLocale());
const theme = ref<BoardTheme>(store.state.board.theme);
const battleMode = ref<BattleMode>(store.state.board.battleMode);
const difficulty = ref<Difficulty>(store.state.game.aiDifficulty);

function onLocaleChange(l: Locale): void {
  locale.value = l;
  setLocale(l);
}

function saveSettings(): void {
  store.commit('board/setTheme', theme.value);
  store.commit('board/setBattleMode', battleMode.value);
  router.push('/');
}
</script>

<template>
  <section class="settings">
    <h1>{{ t('settings.title') }}</h1>
    <div class="grid">
      <LanguagePicker :model-value="locale" @update:model-value="onLocaleChange" />
      <ThemePicker v-model="theme" />
      <BattleModePicker v-model="battleMode" />
      <DifficultyPicker v-model="difficulty" />

      <div class="actions">
        <button class="primary" @click="saveSettings">
          {{ t('settings.save') }}
        </button>
        <button @click="router.push('/')">
          {{ t('game.backToLobby') }}
        </button>
      </div>
    </div>
  </section>
</template>

<style scoped>
.settings {
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
.actions {
  display: flex;
  gap: 0.5rem;
}
.actions button {
  flex: 1;
  padding: 0.75rem 1rem;
  border: 1px solid var(--border);
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
}
.actions .primary {
  background: var(--accent);
  color: #061018;
  border: none;
}
</style>
