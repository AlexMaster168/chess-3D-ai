<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue';

const isPlaying = ref(false);
const isMuted = ref(false);
const volume = ref(0.3);
let audioEngine: any = null;

onMounted(async () => {
  try {
    const mod = (await import(
      /* @vite-ignore */ '@chess-ai/design'
    )) as { getAudioEngine?: () => any };
    if (mod.getAudioEngine) {
      audioEngine = mod.getAudioEngine();
    }
  } catch {
    // Audio engine not available
  }
});

onBeforeUnmount(() => {
  if (audioEngine) {
    audioEngine.stopMusic();
  }
});

function toggleMusic(): void {
  if (!audioEngine) return;

  if (isPlaying.value) {
    audioEngine.stopMusic();
    isPlaying.value = false;
  } else {
    audioEngine.startMusic();
    isPlaying.value = true;
  }
}

function toggleMute(): void {
  if (!audioEngine) return;
  isMuted.value = audioEngine.toggleMute();
}

function setVolume(e: Event): void {
  const target = e.target as HTMLInputElement;
  volume.value = parseFloat(target.value);
  if (audioEngine) {
    audioEngine.setMusicVolume(volume.value);
  }
}
</script>

<template>
  <div class="music-control">
    <button
      class="music-btn"
      :class="{ active: isPlaying }"
      @click="toggleMusic"
      :title="isPlaying ? 'Stop music' : 'Play music'"
    >
      <span v-if="isPlaying">♪</span>
      <span v-else>♪</span>
    </button>
    <button
      class="mute-btn"
      :class="{ muted: isMuted }"
      @click="toggleMute"
      :title="isMuted ? 'Unmute' : 'Mute'"
    >
      {{ isMuted ? '🔇' : '🔊' }}
    </button>
    <input
      type="range"
      class="volume-slider"
      min="0"
      max="1"
      step="0.05"
      :value="volume"
      @input="setVolume"
      title="Music volume"
    />
  </div>
</template>

<style scoped>
.music-control {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  background: var(--surface-1);
  border-radius: 8px;
  border: 1px solid var(--border);
}

.music-btn,
.mute-btn {
  background: transparent;
  border: none;
  color: var(--text);
  cursor: pointer;
  font-size: 1.2rem;
  padding: 0.25rem;
  border-radius: 4px;
  transition: all 0.2s;
}

.music-btn:hover,
.mute-btn:hover {
  background: var(--surface-2);
}

.music-btn.active {
  color: var(--accent);
}

.mute-btn.muted {
  opacity: 0.5;
}

.volume-slider {
  width: 80px;
  height: 4px;
  -webkit-appearance: none;
  appearance: none;
  background: var(--border);
  border-radius: 2px;
  outline: none;
}

.volume-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 12px;
  height: 12px;
  background: var(--accent);
  border-radius: 50%;
  cursor: pointer;
}

.volume-slider::-moz-range-thumb {
  width: 12px;
  height: 12px;
  background: var(--accent);
  border-radius: 50%;
  cursor: pointer;
  border: none;
}
</style>
