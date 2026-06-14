<script setup lang="ts">
import type { BattleMode } from '@/types/shared';

defineProps<{
  modelValue: BattleMode;
}>();
const emit = defineEmits<{
  (e: 'update:modelValue', m: BattleMode): void;
}>();

const modes: Array<{ value: BattleMode; label: string; desc: string }> = [
  { value: 'classic', label: 'Classic', desc: 'Standard capture animations' },
  { value: 'battle-chess', label: 'Battle Chess', desc: 'Animated battle sequences' },
];
</script>

<template>
  <fieldset class="picker">
    <legend>Battle mode</legend>
    <div class="row">
      <button
        v-for="m in modes"
        :key="m.value"
        type="button"
        :class="{ selected: modelValue === m.value }"
        @click="emit('update:modelValue', m.value)"
      >
        <span class="label">{{ m.label }}</span>
        <span class="desc">{{ m.desc }}</span>
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
  flex-direction: column;
  gap: 0.25rem;
}
button.selected {
  border-color: var(--accent);
  background: var(--surface-2);
}
.label {
  font-weight: 500;
}
.desc {
  font-size: 0.75rem;
  color: var(--text-muted);
}
</style>
