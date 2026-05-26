import { createStore, useStore as baseUseStore, Store } from 'vuex';
import { InjectionKey } from 'vue';
import { playerModule, PlayerState } from './modules/player';
import { gameModule, GameState } from './modules/game';
import { aiModule, AiState } from './modules/ai';
import { analyticsModule, AnalyticsState } from './modules/analytics';
import { boardModule, BoardState } from './modules/board';

export interface RootState {
  player: PlayerState;
  game: GameState;
  ai: AiState;
  analytics: AnalyticsState;
  board: BoardState;
}

export const storeKey: InjectionKey<Store<RootState>> = Symbol('store');

export const store = createStore<RootState>({
  strict: import.meta.env.DEV,
  modules: {
    player: playerModule,
    game: gameModule,
    ai: aiModule,
    analytics: analyticsModule,
    board: boardModule,
  },
});

export function useStore(): Store<RootState> {
  return baseUseStore(storeKey);
}
