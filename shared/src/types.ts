/** Core domain types for Driftlands V1. */

export type PublicKeyString = string;
export type JourneyId = string;
export type NodeId = string;
export type ArtifactId = string;

export type ArtifactCategory = "armor" | "food" | "tool" | "charm";
export type ArtifactRank = "common" | "uncommon" | "rare" | "epic" | "legendary";
export type ModifierType =
  | "general_survival"
  | "storm_resist"
  | "ambush_resist"
  | "fire_hazard_resist"
  | "resource_boost"
  | "revive_discount";

export type HazardKind = "storm" | "ambush" | "fire" | "cache" | "fork" | "checkpoint";

export type JourneyStatus =
  | "lobby"
  | "active"
  | "awaiting_revive"
  | "survived"
  | "permadeath"
  | "abandoned";

export type NodeOutcome = "survived" | "died" | "skipped" | "pending";

export interface StakeAssetConfig {
  mint: string;
  symbol: string;
  /** Token multiplier for Level Score (DRIFT 2.0, LSTs 1.1–1.3, etc.) */
  tokenMultiplier: number;
  decimals: number;
  isSanctumLst: boolean;
}

export interface LevelStateView {
  player: PublicKeyString;
  usdValueStaked: number;
  durationMultiplier: number;
  tokenMultiplier: number;
  levelScore: number;
  stakedAt: number;
}

export interface ArtifactStats {
  /** Raw combat power contribution (0–100). */
  power: number;
  /** Broad survivability / general hazard help (0–100). */
  vitality: number;
  /** Specialized resist focus (0–100). */
  focus: number;
  /** Soft drop / fortune bias (0–100). */
  luck: number;
  /** Loadout weight — overweight soft-caps survival (0–100). */
  weight: number;
}

export interface ArtifactDefinition {
  artifactId: ArtifactId;
  category: ArtifactCategory;
  rank: ArtifactRank;
  rankTier: number;
  survivalModifier: number;
  modifierType: ModifierType;
  stackLimit: number;
  dropWeight: number;
  minJourneyZone: number;
  reviveDiscount: number;
  flavorText: string;
  displayName: string;
  color: string;
  stats: ArtifactStats;
}

export interface EquippedArtifact {
  artifactId: ArtifactId;
  instanceId: string;
  acquiredAtZone: number;
}

export interface JourneyNode {
  nodeId: NodeId;
  zone: number;
  kind: HazardKind;
  difficulty: number;
  label: string;
  /** Whether this node can open a players-only odds pool */
  oddsPoolEligible: boolean;
  position: { x: number; y: number; z: number };
}

export interface JourneySeed {
  journeyId: JourneyId;
  seed: number;
  biome: "coral_dunes";
  configVersion: string;
  difficulty: "easy" | "standard" | "hard";
  nodes: JourneyNode[];
  createdAt: number;
}

export interface PlayerSession {
  playerId: PublicKeyString;
  journeyId: JourneyId;
  levelScore: number;
  reputation: number;
  zoneIndex: number;
  hp: number;
  inventory: EquippedArtifact[];
  reviveCount: number;
  status: JourneyStatus;
}

export interface HazardRollResult {
  nodeId: NodeId;
  survived: boolean;
  survivalChance: number;
  roll: number;
  itemBonus: number;
  levelBonus: number;
  droppedArtifact?: EquippedArtifact;
}

export interface OddsPoolOutcome {
  outcomeId: string;
  label: string;
  totalStaked: number;
}

export interface OddsPoolView {
  poolId: string;
  journeyId: JourneyId;
  nodeId: NodeId;
  outcomes: OddsPoolOutcome[];
  closeTime: number;
  resolved: boolean;
  winningOutcomeId?: string;
  feeBps: number;
}

export interface JourneyResultPayload {
  journeyId: JourneyId;
  player: PublicKeyString;
  survived: boolean;
  zoneReached: number;
  reviveCount: number;
  reputationDelta: number;
  configVersion: string;
  timestamp: number;
  /** SHA-256 hex of canonical result body for on-chain attestation */
  resultHash: string;
}

export type RoomStatus = "waiting" | "in_progress" | "finished";

export interface RoomPlayer {
  playerId: string;
  displayName: string;
  joinedAt: number;
  ready: boolean;
  session?: PlayerSession;
}

export interface GameRoom {
  roomId: string;
  name: string;
  hostId: string;
  players: RoomPlayer[];
  maxPlayers: number;
  difficulty: "easy" | "standard" | "hard";
  status: RoomStatus;
  createdAt: number;
  journeySeed?: JourneySeed;
}

/** Realtime channel event envelopes (Ably / WS). */
export type RealtimeEvent =
  | { type: "journey.started"; payload: { journeyId: JourneyId; seed: number } }
  | { type: "player.moved"; payload: { playerId: string; zoneIndex: number; position: { x: number; y: number; z: number } } }
  | { type: "hazard.resolved"; payload: HazardRollResult & { playerId: string } }
  | { type: "player.died"; payload: { playerId: string; reviveFeeDrift: number; reviveCount: number } }
  | { type: "player.revived"; payload: { playerId: string; reviveCount: number } }
  | { type: "artifact.looted"; payload: EquippedArtifact & { playerId: string } }
  | { type: "odds_pool.opened"; payload: OddsPoolView }
  | { type: "odds_pool.resolved"; payload: OddsPoolView }
  | { type: "journey.ended"; payload: JourneyResultPayload & { playerId: string } }
  | { type: "room.created"; payload: GameRoom }
  | { type: "room.player_joined"; payload: { roomId: string; player: RoomPlayer } }
  | { type: "room.player_left"; payload: { roomId: string; playerId: string } }
  | { type: "room.started"; payload: { roomId: string; journeySeed: JourneySeed } }
  | { type: "room.ended"; payload: { roomId: string } }
  | { type: "player.ready"; payload: { playerId: string; ready: boolean } }
  | { type: "player.advance"; payload: { playerId: string; zoneIndex: number; status: JourneyStatus } }
  | { type: "lobby.players"; payload: { count: number; players: Array<{ playerId: string; displayName: string }> } };
