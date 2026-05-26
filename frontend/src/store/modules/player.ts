import { Module } from 'vuex';
import type { RootState } from '../index';
import type { Player } from '@/types/shared';
import { api } from '@/services/api';

export interface PlayerState {
  current: Player | null;
  loading: boolean;
  error: string | null;
}

const STORAGE_KEY = 'chess-ai:playerId';

export const playerModule: Module<PlayerState, RootState> = {
  namespaced: true,
  state: (): PlayerState => ({
    current: null,
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
    setPlayer(state, p: Player | null): void {
      state.current = p;
      if (p) localStorage.setItem(STORAGE_KEY, p.id);
      else localStorage.removeItem(STORAGE_KEY);
    },
  },
  actions: {
    async register({ commit }, name: string): Promise<Player | null> {
      commit('setLoading', true);
      commit('setError', null);
      try {
        const p = await api.createPlayer(name);
        commit('setPlayer', p);
        return p;
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'register failed';
        commit('setError', msg);
        // Offline fallback so the UI is never blocked by missing backend.
        const fallback: Player = {
          id: `local-${Date.now()}`,
          name,
          rating: 1200,
          createdAt: new Date().toISOString(),
        };
        commit('setPlayer', fallback);
        return fallback;
      } finally {
        commit('setLoading', false);
      }
    },
    async loadFromStorage({ commit }): Promise<void> {
      const id = localStorage.getItem(STORAGE_KEY);
      if (!id) return;
      commit('setLoading', true);
      try {
        const p = await api.getPlayer(id);
        commit('setPlayer', p);
      } catch {
        // Backend unavailable, keep local id stub.
        commit('setPlayer', {
          id,
          name: 'Player',
          rating: 1200,
          createdAt: new Date().toISOString(),
        });
      } finally {
        commit('setLoading', false);
      }
    },
    logout({ commit }): void {
      commit('setPlayer', null);
    },
  },
};
