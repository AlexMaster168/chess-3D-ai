import type { Difficulty } from './index.js';

/**
 * Difficulty parameter mapping — must match SHARED_CONTRACTS.md §3.
 *
 * | Difficulty   | Depth         | Randomness | Book | Quiescence | Top-K |
 * |--------------|---------------|------------|------|------------|-------|
 * | beginner     | 1             | 0.40       | no   | no         | 10    |
 * | casual       | 2             | 0.15       | no   | no         | 5     |
 * | intermediate | 3             | 0.05       | no   | yes        | 3     |
 * | advanced     | 4             | 0.00       | no   | yes        | 1     |
 * | master       | 5 (iterative) | 0.00       | yes  | yes        | 1     |
 */

export interface DifficultyConfig {
  depth: number;
  randomness: number;        // probability [0,1] of substituting a random legal move
  useBook: boolean;
  useQuiescence: boolean;
  iterativeDeepening: boolean;
  /** When randomness applies and we keep a "good" move, we pick from top-K candidates. */
  topK: number;
}

const TABLE: Record<Difficulty, DifficultyConfig> = {
  beginner: {
    depth: 1,
    randomness: 0.40,
    useBook: false,
    useQuiescence: false,
    iterativeDeepening: false,
    topK: 10,
  },
  casual: {
    depth: 2,
    randomness: 0.15,
    useBook: false,
    useQuiescence: false,
    iterativeDeepening: false,
    topK: 5,
  },
  intermediate: {
    depth: 3,
    randomness: 0.05,
    useBook: false,
    useQuiescence: true,
    iterativeDeepening: false,
    topK: 1,
  },
  advanced: {
    depth: 4,
    randomness: 0,
    useBook: false,
    useQuiescence: true,
    iterativeDeepening: false,
    topK: 1,
  },
  master: {
    depth: 5,
    randomness: 0,
    useBook: true,
    useQuiescence: true,
    iterativeDeepening: true,
    topK: 1,
  },
};

export function getDifficultyConfig(d: Difficulty): DifficultyConfig {
  return TABLE[d];
}
