/**
 * Public types for @chess-ai/design.
 * Mirror of SHARED_CONTRACTS.md section 1.
 */

export type ThemeName = 'classic' | 'neon' | 'glass';
export type AnimationSpeed = 'slow' | 'normal' | 'fast';
export type HighlightKind = 'legal' | 'last-move' | 'check';
export type EffectKind = 'capture' | 'check' | 'checkmate' | 'castle';

export interface Move {
  from: string;
  to: string;
  promotion?: string;
}

export interface BoardEvents {
  squareClick: (square: string) => void;
  move: (m: Move) => void;
  animationEnd: (kind: string) => void;
}

export interface ChessBoard3D {
  mount(container: HTMLElement): Promise<void>;
  unmount(): void;
  setBoardState(fen: string, animated?: boolean): void;
  setAnimationSpeed(speed: AnimationSpeed): void;
  highlightSquares(squares: string[], kind?: HighlightKind): void;
  setTheme(theme: ThemeName): void;
  on<E extends keyof BoardEvents>(event: E, cb: BoardEvents[E]): void;
  playEffect(kind: EffectKind): void;
}

export type PieceColor = 'w' | 'b';
export type PieceType = 'p' | 'n' | 'b' | 'r' | 'q' | 'k';

export interface PieceSpec {
  color: PieceColor;
  type: PieceType;
  square: string;
}
