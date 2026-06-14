<script setup lang="ts">
import type { Locale } from '@/i18n';

defineProps<{
  modelValue: Locale;
}>();
const emit = defineEmits<{
  (e: 'update:modelValue', l: Locale): void;
}>();

const locales: Array<{ value: Locale; label: string; flag: string }> = [
  { value: 'en', label: 'English', flag: '🇬🇧' },
  { value: 'uk', label: 'Українська', flag: '🇺🇦' },
];
</script>

<template>
  <fieldset class="picker">
    <legend>Language / Мова</legend>
    <div class="row">
      <button
        v-for="l in locales"
        :key="l.value"
        type="button"
        :class="{ selected: modelValue === l.value }"
        @click="emit('update:modelValue', l.value)"
      >
        <span class="flag">{{ l.flag }}</span>
        <span class="label">{{ l.label }}</span>
      </button>
    </div>
  </fieldset>
</template>

<style scoped>
.picker {
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 0.75rem 1rem;
}
legend {
  padding: 0 0.4rem;
  color: var(--text-muted);
  font-size: 0.8rem;
}
.row {
  display: flex;
  gap: 0.5rem;
}
button {
  flex: 1;
  background: var(--surface-1);
  color: var(--text);
  border: 1px solid var(--border);
  border-radius: 6px;
  padding: 0.5rem 0.75rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}
button.selected {
  border-color: var(--accent);
  background: var(--surface-2);
}
.flag {
  font-size: 1.2rem;
}
.label {
  font-weight: 500;
}
</style>
