<script setup lang="ts">
defineProps<{
  open: boolean;
  color: 'w' | 'b';
}>();

const emit = defineEmits<{
  (e: 'pick', piece: 'q' | 'r' | 'b' | 'n'): void;
  (e: 'cancel'): void;
}>();

const glyphs: Record<'w' | 'b', Record<string, string>> = {
  w: { q: '♕', r: '♖', b: '♗', n: '♘' },
  b: { q: '♛', r: '♜', b: '♝', n: '♞' },
};
</script>

<template>
  <div v-if="open" class="overlay" @click.self="emit('cancel')">
    <div class="dialog">
      <p>Promote to:</p>
      <div class="row">
        <button
          v-for="p in ['q', 'r', 'b', 'n'] as const"
          :key="p"
          @click="emit('pick', p)"
        >
          <span class="glyph">{{ glyphs[color][p] }}</span>
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
}
.dialog {
  background: var(--surface-1);
  padding: 1.25rem 1.5rem;
  border-radius: 8px;
  border: 1px solid var(--border);
  min-width: 280px;
  text-align: center;
}
.row {
  display: flex;
  gap: 0.5rem;
  margin-top: 0.75rem;
  justify-content: center;
}
button {
  background: var(--surface-2);
  border: 1px solid var(--border);
  border-radius: 6px;
  padding: 0.5rem 0.75rem;
  font-size: 2rem;
  cursor: pointer;
  color: inherit;
}
button:hover {
  border-color: var(--accent);
}
</style>
