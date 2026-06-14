/**
 * @chess-ai/design — public entry point.
 *
 * The frontend imports `createBoard()` and works against the
 * `ChessBoard3D` interface defined in SHARED_CONTRACTS.md §1.
 */

export type {
  ChessBoard3D,
  ThemeName,
  AnimationSpeed,
  HighlightKind,
  EffectKind,
  BattleMode,
  Move,
  BoardEvents,
  MoveValidator
} from './types.js';

export { STARTING_FEN } from './util/fen.js';

// Audio system exports
export { AudioEngine, getAudioEngine, type SoundEffect } from './audio/AudioEngine.js';
export { getBattleSounds, type SoundCue } from './audio/BattleSoundMap.js';

import type { ChessBoard3D } from './types.js';
import { BoardController } from './BoardController.js';

/**
 * Factory matching the SHARED_CONTRACTS.md signature.
 */
export function createBoard(): ChessBoard3D {
  return new BoardController();
}
