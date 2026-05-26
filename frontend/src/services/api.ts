import axios, { AxiosInstance } from 'axios';
import type {
  Player,
  Game,
  CreateGameDto,
  PlayerAnalytics,
  LeaderboardEntry,
  GlobalAnalytics,
} from '@/types/shared';

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '/api';

const client: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 10_000,
  headers: { 'Content-Type': 'application/json' },
});

// Minimal error wrapper so callers get a uniform shape.
async function request<T>(fn: () => Promise<{ data: T }>): Promise<T> {
  try {
    const res = await fn();
    return res.data;
  } catch (err: unknown) {
    if (axios.isAxiosError(err)) {
      // Backend error shape is intentionally loose — accept any { message }.
      const data = err.response?.data as { message?: string } | undefined;
      throw new Error(data?.message ?? err.message ?? 'API error');
    }
    throw err;
  }
}

export const api = {
  // --- Players ---
  createPlayer(name: string): Promise<Player> {
    return request(() => client.post<Player>('/players', { name }));
  },
  getPlayer(id: string): Promise<Player> {
    return request(() => client.get<Player>(`/players/${id}`));
  },

  // --- Games ---
  createGame(dto: CreateGameDto): Promise<Game> {
    return request(() => client.post<Game>('/games', dto));
  },
  getGame(id: string): Promise<Game> {
    return request(() => client.get<Game>(`/games/${id}`));
  },
  listGames(opts: { player?: string; limit?: number } = {}): Promise<Game[]> {
    return request(() =>
      client.get<Game[]>('/games', {
        params: { player: opts.player, limit: opts.limit },
      }),
    );
  },

  // --- Analytics ---
  getPlayerAnalytics(id: string): Promise<PlayerAnalytics> {
    return request(() =>
      client.get<PlayerAnalytics>(`/analytics/player/${id}`),
    );
  },
  getLeaderboard(limit = 20): Promise<LeaderboardEntry[]> {
    return request(() =>
      client.get<LeaderboardEntry[]>('/analytics/leaderboard', {
        params: { limit },
      }),
    );
  },
  getGlobalAnalytics(): Promise<GlobalAnalytics> {
    return request(() => client.get<GlobalAnalytics>('/analytics/global'));
  },
};

export type Api = typeof api;
