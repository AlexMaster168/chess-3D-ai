<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue';
import { useStore } from '@/store';

const props = defineProps<{
  initialSeconds?: number;
  increment?: number;
}>();

const store = useStore();

const initial = props.initialSeconds ?? 600;

const whiteRemaining = ref(initial);
const blackRemaining = ref(initial);
let interval: number | null = null;
let lastTick = Date.now();

const turn = computed(() => store.state.game.turn);
const status = computed(() => store.state.game.status);

function start(): void {
  stop();
  lastTick = Date.now();
  interval = window.setInterval(() => {
    const now = Date.now();
    const dt = (now - lastTick) / 1000;
    lastTick = now;
    if (status.value === 'playing' || status.value === 'check') {
      if (turn.value === 'w') {
        whiteRemaining.value = Math.max(0, whiteRemaining.value - dt);
      } else {
        blackRemaining.value = Math.max(0, blackRemaining.value - dt);
      }
    }
  }, 250);
}

function stop(): void {
  if (interval !== null) {
    clearInterval(interval);
    interval = null;
  }
}

function reset(): void {
  whiteRemaining.value = initial;
  blackRemaining.value = initial;
}

watch(
  () => store.state.game.status,
  (s) => {
    if (s === 'playing') start();
    else if (
      s === 'checkmate' ||
      s === 'stalemate' ||
      s === 'draw' ||
      s === 'resigned'
    ) {
      stop();
    } else if (s === 'idle') {
      stop();
      reset();
    }
  },
  { immediate: true },
);

watch(
  () => store.state.game.moveHistory.length,
  () => {
    if (props.increment) {
      const prev = store.state.game.moveHistory.at(-1);
      if (prev) {
        if (prev.color === 'w') whiteRemaining.value += props.increment;
        else blackRemaining.value += props.increment;
      }
    }
  },
);

onBeforeUnmount(stop);

function fmt(s: number): string {
  const min = Math.floor(s / 60)
    .toString()
    .padStart(2, '0');
  const sec = Math.floor(s % 60)
    .toString()
    .padStart(2, '0');
  return `${min}:${sec}`;
}
</script>

<template>
  <div class="timers">
    <div class="timer" :class="{ active: turn === 'b' }">
      <span class="label">Black</span>
      <span class="value">{{ fmt(blackRemaining) }}</span>
    </div>
    <div class="timer" :class="{ active: turn === 'w' }">
      <span class="label">White</span>
      <span class="value">{{ fmt(whiteRemaining) }}</span>
    </div>
  </div>
</template>

<style scoped>
.timers {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}
.timer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: var(--surface-1);
  padding: 0.5rem 0.75rem;
  border-radius: 6px;
  border: 1px solid transparent;
  font-family: 'JetBrains Mono', monospace, ui-monospace;
}
.timer.active {
  border-color: var(--accent);
  background: var(--surface-2);
}
.label {
  font-size: 0.75rem;
  color: var(--text-muted);
  text-transform: uppercase;
}
.value {
  font-size: 1.1rem;
  font-weight: 600;
}
</style>
