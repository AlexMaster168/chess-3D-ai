<script setup lang="ts">
import type { Difficulty } from '@/types/shared';

defineProps<{
  modelValue: Difficulty;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', d: Difficulty): void;
}>();

const options: Array<{ value: Difficulty; label: string; hint: string }> = [
  { value: 'beginner', label: 'Beginner', hint: 'depth 1, often random' },
  { value: 'casual', label: 'Casual', hint: 'depth 2' },
  { value: 'intermediate', label: 'Intermediate', hint: 'depth 3' },
  { value: 'advanced', label: 'Advanced', hint: 'depth 4' },
  { value: 'master', label: 'Master', hint: 'iterative deepening, book' },
];
</script>

<template>
  <fieldset class="picker">
    <legend>AI difficulty</legend>
    <label
      v-for="o in options"
      :key="o.value"
      :class="{ selected: modelValue === o.value }"
    >
      <input
        type="radio"
        :value="o.value"
        :checked="modelValue === o.value"
        @change="emit('update:modelValue', o.value)"
      />
      <span class="label">{{ o.label }}</span>
      <small>{{ o.hint }}</small>
    </label>
  </fieldset>
</template>

<style scoped>
.picker {
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 0.75rem 1rem;
  display: grid;
  gap: 0.4rem;
}
legend {
  padding: 0 0.4rem;
  color: var(--text-muted);
  font-size: 0.8rem;
}
label {
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: 0.5rem;
  padding: 0.4rem 0.5rem;
  border-radius: 6px;
  cursor: pointer;
}
label.selected {
  background: var(--surface-2);
  outline: 1px solid var(--accent);
}
.label {
  font-weight: 500;
}
small {
  color: var(--text-muted);
}
</style>
