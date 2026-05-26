import { Module } from 'vuex';
import type { RootState } from '../index';
import type {
  GlobalAnalytics,
  LeaderboardEntry,
  PlayerAnalytics,
  Game,
} from '@/types/shared';
import { api } from '@/services/api';

export interface AnalyticsState {
  player: PlayerAnalytics | null;
  global: GlobalAnalytics | null;
  leaderboard: LeaderboardEntry[];
  history: Game[];
  loading: boolean;
  error: string | null;
}

export const analyticsModule: Module<AnalyticsState, RootState> = {
  namespaced: true,
  state: (): AnalyticsState => ({
    player: null,
    global: null,
    leaderboard: [],
    history: [],
    loading: false,
    error: null,
  }),
  mutations: {
    setLoading(state, v: boolean): void {
      state.loading = v;
    },
    setError(state, msg: string | null): void {
      state.error = msg;
    },
    setPlayer(state, p: PlayerAnalytics | null): void {
      state.player = p;
    },
    setGlobal(state, g: GlobalAnalytics | null): void {
      state.global = g;
    },
    setLeaderboard(state, l: LeaderboardEntry[]): void {
      state.leaderboard = l;
    },
    setHistory(state, h: Game[]): void {
      state.history = h;
    },
  },
  actions: {
    async fetchPlayer({ commit }, playerId: string): Promise<void> {
      commit('setLoading', true);
      commit('setError', null);
      try {
        const data = await api.getPlayerAnalytics(playerId);
        commit('setPlayer', data);
      } catch (err: unknown) {
        commit(
          'setError',
          err instanceof Error ? err.message : 'analytics fetch failed',
        );
        commit('setPlayer', null);
      } finally {
        commit('setLoading', false);
      }
    },
    async fetchGlobal({ commit }): Promise<void> {
      try {
        const data = await api.getGlobalAnalytics();
        commit('setGlobal', data);
      } catch (err: unknown) {
        commit(
          'setError',
          err instanceof Error ? err.message : 'global fetch failed',
        );
      }
    },
    async fetchLeaderboard({ commit }, limit = 20): Promise<void> {
      commit('setLoading', true);
      try {
        const data = await api.getLeaderboard(limit);
        commit('setLeaderboard', data);
      } catch (err: unknown) {
        commit(
          'setError',
          err instanceof Error ? err.message : 'leaderboard fetch failed',
        );
        commit('setLeaderboard', []);
      } finally {
        commit('setLoading', false);
      }
    },
    async fetchHistory(
      { commit },
      opts: { player?: string; limit?: number } = {},
    ): Promise<void> {
      commit('setLoading', true);
      try {
        const data = await api.listGames(opts);
        commit('setHistory', data);
      } catch (err: unknown) {
        commit(
          'setError',
          err instanceof Error ? err.message : 'history fetch failed',
        );
        commit('setHistory', []);
      } finally {
        commit('setLoading', false);
      }
    },
  },
};
