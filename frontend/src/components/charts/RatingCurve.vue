<script setup lang="ts">
import { Line } from 'vue-chartjs';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { computed } from 'vue';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
);

const props = defineProps<{
  ratings: number[];
}>();

const data = computed(() => ({
  labels: props.ratings.map((_, i) => `#${i + 1}`),
  datasets: [
    {
      label: 'Rating',
      data: props.ratings,
      borderColor: '#6cb6ff',
      backgroundColor: 'rgba(108, 182, 255, 0.2)',
      fill: true,
      tension: 0.25,
    },
  ],
}));

const options = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { display: false } },
  scales: {
    y: { ticks: { color: '#aaa' }, grid: { color: '#222' } },
    x: { ticks: { color: '#aaa' }, grid: { color: '#222' } },
  },
};
</script>

<template>
  <div class="chart-wrap">
    <Line :data="data" :options="options" />
  </div>
</template>

<style scoped>
.chart-wrap {
  height: 240px;
}
</style>
