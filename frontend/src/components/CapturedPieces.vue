<script setup lang="ts">
import { computed } from 'vue';
import { useStore } from '@/store';

const store = useStore();

const GLYPHS: Record<string, string> = {
  wp: '♙',
  wn: '♘',
  wb: '♗',
  wr: '♖',
  wq: '♕',
  bp: '♟',
  bn: '♞',
  bb: '♝',
  br: '♜',
  bq: '♛',
};

// Counts captures by color.
const captured = computed(() => {
  const byColor: { w: string[]; b: string[] } = { w: [], b: [] };
  for (const m of store.state.game.moveHistory) {
    if (m.captured) {
      // m.color is the side that moved; captured piece is the opposite color.
      const victimColor = m.color === 'w' ? 'b' : 'w';
      byColor[victimColor].push(`${victimColor}${m.captured}`);
    }
  }
  return byColor;
});
</script>

<template>
  <div class="captured">
    <div class="row">
      <span class="label">White lost:</span>
      <span v-for="(k, i) in captured.w" :key="i" class="glyph">{{ GLYPHS[k] }}</span>
    </div>
    <div class="row">
      <span class="label">Black lost:</span>
      <span v-for="(k, i) in captured.b" :key="i" class="glyph">{{ GLYPHS[k] }}</span>
    </div>
  </div>
</template>

<style scoped>
.captured {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  font-size: 1.1rem;
  background: var(--surface-1);
  padding: 0.5rem 0.75rem;
  border-radius: 6px;
}
.row {
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem;
  align-items: center;
}
.label {
  font-size: 0.7rem;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  margin-right: 0.5rem;
}
.glyph {
  color: #ddd;
}
</style>
