import { Module } from 'vuex';
import { Chess, Move } from 'chess.js';
import type { RootState } from '../index';
import type {
  Color,
  Difficulty,
  GameResult,
  StructuredMove,
  GameMode,
} from '@/types/shared';
import { api } from '@/services/api';

export type GameStatus =
  | 'idle'
  | 'playing'
  | 'check'
  | 'checkmate'
  | 'stalemate'
  | 'draw'
  | 'resigned';

export interface GameState {
  fen: string;
  pgn: string;
  fenHistory: string[];
  moveHistory: Move[];
  turn: Color;
  status: GameStatus;
  result: GameResult | null;
  lastMove: StructuredMove | null;
  playerColor: Color;
  aiDifficulty: Difficulty;
  gameMode: GameMode;
  startedAt: number | null;
  endedAt: number | null;
  thinking: boolean;
  error: string | null;
}

const STARTING_FEN =
  'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

// chess.js instance lives outside reactivity; we always re-create on reset.
let chess = new Chess();

function recomputeStatus(c: Chess): {
  status: GameStatus;
  result: GameResult | null;
} {
  if (c.isCheckmate()) {
    return {
      status: 'checkmate',
      result: c.turn() === 'w' ? '0-1' : '1-0',
    };
  }
  if (c.isStalemate()) return { status: 'stalemate', result: '1/2-1/2' };
  if (c.isDraw() || c.isThreefoldRepetition() || c.isInsufficientMaterial()) {
    return { status: 'draw', result: '1/2-1/2' };
  }
  if (c.isCheck()) return { status: 'check', result: null };
  return { status: 'playing', result: null };
}

export const gameModule: Module<GameState, RootState> = {
  namespaced: true,
  state: (): GameState => ({
    fen: STARTING_FEN,
    pgn: '',
    fenHistory: [STARTING_FEN],
    moveHistory: [],
    turn: 'w',
    status: 'idle',
    result: null,
    lastMove: null,
    playerColor: 'w',
    aiDifficulty: 'intermediate',
    gameMode: 'ai',
    startedAt: null,
    endedAt: null,
    thinking: false,
    error: null,
  }),
  mutations: {
    reset(state, payload: { color: Color; difficulty: Difficulty; mode: GameMode }): void {
      chess = new Chess();
      state.fen = chess.fen();
      state.pgn = '';
      state.fenHistory = [state.fen];
      state.moveHistory = [];
      state.turn = chess.turn();
      state.status = 'playing';
      state.result = null;
      state.lastMove = null;
      state.playerColor = payload.color;
      state.aiDifficulty = payload.difficulty;
      state.gameMode = payload.mode;
      state.startedAt = Date.now();
      state.endedAt = null;
      state.thinking = false;
      state.error = null;
    },
    applyMove(state, move: Move): void {
      state.fen = chess.fen();
      state.pgn = chess.pgn();
      state.fenHistory.push(state.fen);
      state.moveHistory.push(move);
      state.turn = chess.turn();
      state.lastMove = {
        from: move.from,
        to: move.to,
        promotion: move.promotion,
      };
      const s = recomputeStatus(chess);
      state.status = s.status;
      state.result = s.result;
      if (s.result !== null) state.endedAt = Date.now();
    },
    setThinking(state, v: boolean): void {
      state.thinking = v;
    },
    setError(state, msg: string | null): void {
      state.error = msg;
    },
    resign(state, by: Color): void {
      state.status = 'resigned';
      state.result = by === 'w' ? '0-1' : '1-0';
      state.endedAt = Date.now();
    },
    agreeDraw(state): void {
      state.status = 'draw';
      state.result = '1/2-1/2';
      state.endedAt = Date.now();
    },
    removeLastMove(state): void {
      state.moveHistory.pop();
      state.fenHistory.pop();
      state.fen = chess.fen();
      state.pgn = chess.pgn();
      state.turn = chess.turn();
      state.lastMove = state.moveHistory.length > 0
        ? { from: state.moveHistory[state.moveHistory.length - 1].from, to: state.moveHistory[state.moveHistory.length - 1].to }
        : null;
      const s = recomputeStatus(chess);
      state.status = s.status;
      state.result = s.result;
      state.endedAt = null;
    },
  },
  actions: {
    newGame(
      { commit },
      payload: { color: Color; difficulty: Difficulty; mode: GameMode },
    ): void {
      commit('reset', payload);
    },
    // Attempts a move; returns true if legal.
    move({ commit, state }, move: StructuredMove): boolean {
      if (state.status !== 'playing' && state.status !== 'check') {
        return false;
      }
      // Clear any previous error so the banner doesn't linger between attempts.
      commit('setError', null);
      try {
        const payload: { from: string; to: string; promotion?: string } = {
          from: move.from,
          to: move.to,
        };
        if (move.promotion) payload.promotion = move.promotion;
        const result = chess.move(payload);
        if (!result) {
          commit('setError', 'Illegal move');
          return false;
        }
        commit('applyMove', result);
        return true;
      } catch {
        commit('setError', 'Illegal move');
        return false;
      }
    },
    resign({ commit, state }): void {
      commit('resign', state.playerColor);
    },
    draw({ commit }): void {
      commit('agreeDraw');
    },
    undo({ commit, state }): boolean {
      if (state.moveHistory.length === 0) return false;
      // Go back one move in chess.js
      chess.undo();
      // Remove last move from history via mutation
      commit('removeLastMove');
      return true;
    },
    async saveToBackend({ state, rootState }): Promise<void> {
      if (!state.result) return;
      const player = rootState.player.current;
      if (!player) return;
      const durationSec = state.endedAt && state.startedAt
        ? Math.max(0, Math.round((state.endedAt - state.startedAt) / 1000))
        : 0;
      try {
        const aiId = `ai:${state.aiDifficulty}`;
        await api.createGame({
          whiteId: state.playerColor === 'w' ? player.id : aiId,
          blackId: state.playerColor === 'b' ? player.id : aiId,
          result: state.result,
          pgn: state.pgn,
          fenHistory: state.fenHistory,
          movesCount: state.moveHistory.length,
          durationSec,
          aiDifficulty: state.aiDifficulty,
        });
      } catch {
        // Swallow — UI should never block on backend.
      }
    },
  },
  getters: {
    legalMovesFrom: () => (square: string): string[] => {
      const moves = chess.moves({ square: square as never, verbose: true });
      return moves.map((m) => m.to);
    },
    isPlayerTurn: (state): boolean => {
      // In hotseat mode, both players can move
      if (state.gameMode === 'hotseat') return true;
      return state.turn === state.playerColor;
    },
    isGameOver: (state): boolean =>
      state.status === 'checkmate' ||
      state.status === 'stalemate' ||
      state.status === 'draw' ||
      state.status === 'resigned',
  },
};
