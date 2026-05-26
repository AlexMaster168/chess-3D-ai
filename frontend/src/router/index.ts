import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'lobby',
    component: () => import('@/views/LobbyView.vue'),
  },
  {
    path: '/play',
    name: 'game',
    component: () => import('@/views/GameView.vue'),
  },
  {
    path: '/history',
    name: 'history',
    component: () => import('@/views/HistoryView.vue'),
  },
  {
    path: '/analytics/:playerId',
    name: 'analytics',
    component: () => import('@/views/PlayerAnalyticsView.vue'),
    props: true,
  },
  {
    path: '/leaderboard',
    name: 'leaderboard',
    component: () => import('@/views/LeaderboardView.vue'),
  },
  { path: '/:pathMatch(.*)*', redirect: '/' },
];

export const router = createRouter({
  history: createWebHistory(),
  routes,
});
