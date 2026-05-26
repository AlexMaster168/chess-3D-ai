<script setup lang="ts">
import { Doughnut } from 'vue-chartjs';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from 'chart.js';
import { computed } from 'vue';

ChartJS.register(ArcElement, Tooltip, Legend);

const props = defineProps<{
  wins: number;
  losses: number;
  draws: number;
}>();

const data = computed(() => ({
  labels: ['Wins', 'Losses', 'Draws'],
  datasets: [
    {
      data: [props.wins, props.losses, props.draws],
      backgroundColor: ['#4ade80', '#f87171', '#94a3b8'],
      borderWidth: 0,
    },
  ],
}));

const options = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { position: 'bottom' as const, labels: { color: '#ccc' } } },
  cutout: '60%',
};
</script>

<template>
  <div class="chart-wrap">
    <Doughnut :data="data" :options="options" />
  </div>
</template>

<style scoped>
.chart-wrap {
  height: 240px;
}
</style>
