import { Module } from 'vuex';
import type { RootState } from '../index';
import type { AnimationSpeed, BoardTheme, BattleMode } from '@/types/shared';

export interface BoardState {
  theme: BoardTheme;
  animationSpeed: AnimationSpeed;
  battleMode: BattleMode;
  highlightedSquares: string[];
  highlightKind: 'legal' | 'last-move' | 'check' | null;
  selectedSquare: string | null;
}

export const boardModule: Module<BoardState, RootState> = {
  namespaced: true,
  state: (): BoardState => ({
    theme: 'classic',
    animationSpeed: 'normal',
    battleMode: 'classic',
    highlightedSquares: [],
    highlightKind: null,
    selectedSquare: null,
  }),
  mutations: {
    setTheme(state, t: BoardTheme): void {
      state.theme = t;
    },
    setAnimationSpeed(state, s: AnimationSpeed): void {
      state.animationSpeed = s;
    },
    setBattleMode(state, m: BattleMode): void {
      state.battleMode = m;
    },
    setHighlights(
      state,
      payload: {
        squares: string[];
        kind: 'legal' | 'last-move' | 'check' | null;
      },
    ): void {
      state.highlightedSquares = payload.squares;
      state.highlightKind = payload.kind;
    },
    setSelectedSquare(state, sq: string | null): void {
      state.selectedSquare = sq;
    },
    clearHighlights(state): void {
      state.highlightedSquares = [];
      state.highlightKind = null;
      state.selectedSquare = null;
    },
  },
};
