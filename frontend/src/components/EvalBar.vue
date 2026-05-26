<script setup lang="ts">
import { computed } from 'vue';
import { useStore } from '@/store';

const store = useStore();

const evaluation = computed(() => store.state.ai.lastEvaluation);

// Clamp to roughly [-10, 10] pawns for the bar.
const whitePct = computed(() => {
  const v = Math.max(-10, Math.min(10, evaluation.value));
  return Math.round(((v + 10) / 20) * 100);
});

const display = computed(() => {
  const v = evaluation.value;
  if (Math.abs(v) > 99) return v > 0 ? '+M' : '-M';
  return (v >= 0 ? '+' : '') + v.toFixed(1);
});
</script>

<template>
  <div class="eval-bar" :title="`Evaluation ${display}`">
    <div class="white" :style="{ height: whitePct + '%' }"></div>
    <span class="value">{{ display }}</span>
  </div>
</template>

<style scoped>
.eval-bar {
  position: relative;
  width: 28px;
  height: 100%;
  min-height: 320px;
  background: #1c1c1c;
  border-radius: 4px;
  overflow: hidden;
  border: 1px solid var(--border);
}
.white {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: #f0f0f0;
  transition: height 0.3s ease;
}
.value {
  position: absolute;
  top: 4px;
  left: 0;
  right: 0;
  text-align: center;
  font-size: 0.7rem;
  font-family: 'JetBrains Mono', monospace, ui-monospace;
  color: #ccc;
  mix-blend-mode: difference;
}
</style>
