import type {
  JourneyResultPayload,
  JourneySeed,
  OddsPoolView,
  PlayerSession,
  HazardRollResult,
} from "@driftlands/shared";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API}/api${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? `HTTP ${res.status}`);
  return data as T;
}

export const api = {
  startJourney(body: { playerId: string; difficulty: string; levelScore: number }) {
    return request<{
      journey: JourneySeed;
      session: PlayerSession;
      reviveFeePreview: number;
    }>("/journeys", { method: "POST", body: JSON.stringify(body) });
  },
  getJourney(id: string) {
    return request<{
      journey: JourneySeed;
      session: PlayerSession;
      reviveFeePreview: number | null;
    }>(`/journeys/${id}`);
  },
  advance(id: string) {
    return request<{
      result: HazardRollResult;
      session: PlayerSession;
      pool?: OddsPoolView;
      ended?: JourneyResultPayload;
      signature?: string;
    }>(`/journeys/${id}/advance`, { method: "POST", body: "{}" });
  },
  revive(id: string) {
    return request<{ session: PlayerSession; fee: number }>(`/journeys/${id}/revive`, {
      method: "POST",
      body: JSON.stringify({ demoPaid: true }),
    });
  },
  enterPool(poolId: string, body: { playerId: string; outcomeId: string; amount: number }) {
    return request<{ pool: OddsPoolView }>(`/pools/${poolId}/enter`, {
      method: "POST",
      body: JSON.stringify(body),
    });
  },
  leaderboard() {
    return request<{
      entries: Array<{ playerId: string; reputation: number; journeysWon: number; displayName?: string }>;
    }>("/leaderboard");
  },
};
