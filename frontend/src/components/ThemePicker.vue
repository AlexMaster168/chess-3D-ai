<script setup lang="ts">
import type { BoardTheme } from '@/types/shared';

defineProps<{
  modelValue: BoardTheme;
}>();
const emit = defineEmits<{
  (e: 'update:modelValue', t: BoardTheme): void;
}>();

const themes: Array<{ value: BoardTheme; label: string }> = [
  { value: 'classic', label: 'Classic' },
  { value: 'neon', label: 'Neon' },
  { value: 'glass', label: 'Glass' },
];
</script>

<template>
  <fieldset class="picker">
    <legend>Board theme</legend>
    <div class="row">
      <button
        v-for="t in themes"
        :key="t.value"
        type="button"
        :class="{ selected: modelValue === t.value }"
        @click="emit('update:modelValue', t.value)"
      >
        {{ t.label }}
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
}
button.selected {
  border-color: var(--accent);
  background: var(--surface-2);
}
</style>
