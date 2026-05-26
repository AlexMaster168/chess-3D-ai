<script setup lang="ts">
import { Bar } from 'vue-chartjs';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { computed } from 'vue';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
);

const props = defineProps<{
  openings: { eco: string; name: string; count: number }[];
}>();

const data = computed(() => ({
  labels: props.openings.map((o) => `${o.eco} ${o.name}`),
  datasets: [
    {
      label: 'Played',
      data: props.openings.map((o) => o.count),
      backgroundColor: '#a78bfa',
    },
  ],
}));

const options = {
  responsive: true,
  maintainAspectRatio: false,
  indexAxis: 'y' as const,
  plugins: { legend: { display: false } },
  scales: {
    x: { ticks: { color: '#aaa' }, grid: { color: '#222' } },
    y: { ticks: { color: '#aaa' }, grid: { color: '#222' } },
  },
};
</script>

<template>
  <div class="chart-wrap">
    <Bar :data="data" :options="options" />
  </div>
</template>

<style scoped>
.chart-wrap {
  height: 280px;
}
</style>
