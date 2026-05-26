import { Module } from 'vuex';
import type { RootState } from '../index';
import type { Difficulty, MoveResult } from '@/types/shared';
import { engineWorker } from '@/services/engineWorker';

export interface AiState {
  ready: boolean;
  thinking: boolean;
  lastEvaluation: number;
  lastMove: MoveResult | null;
  error: string | null;
}

export const aiModule: Module<AiState, RootState> = {
  namespaced: true,
  state: (): AiState => ({
    ready: false,
    thinking: false,
    lastEvaluation: 0,
    lastMove: null,
    error: null,
  }),
  mutations: {
    setReady(state, v: boolean): void {
      state.ready = v;
    },
    setThinking(state, v: boolean): void {
      state.thinking = v;
    },
    setLastMove(state, m: MoveResult | null): void {
      state.lastMove = m;
      if (m) state.lastEvaluation = m.evaluation;
    },
    setEvaluation(state, n: number): void {
      state.lastEvaluation = n;
    },
    setError(state, msg: string | null): void {
      state.error = msg;
    },
  },
  actions: {
    async init({ commit, state }): Promise<void> {
      if (state.ready) return;
      try {
        await engineWorker.init();
        commit('setReady', true);
      } catch (err: unknown) {
        commit(
          'setError',
          err instanceof Error ? err.message : 'engine init failed',
        );
      }
    },
    async requestMove(
      { commit },
      payload: { fen: string; difficulty: Difficulty },
    ): Promise<MoveResult | null> {
      commit('setThinking', true);
      commit('setError', null);
      try {
        const m = await engineWorker.getBestMove(
          payload.fen,
          payload.difficulty,
        );
        commit('setLastMove', m);
        return m;
      } catch (err: unknown) {
        commit(
          'setError',
          err instanceof Error ? err.message : 'engine error',
        );
        return null;
      } finally {
        commit('setThinking', false);
      }
    },
    async evaluate({ commit }, fen: string): Promise<number> {
      try {
        const score = await engineWorker.evaluatePosition(fen);
        commit('setEvaluation', score);
        return score;
      } catch {
        return 0;
      }
    },
    teardown({ commit }): void {
      engineWorker.stop();
      commit('setReady', false);
    },
  },
};
