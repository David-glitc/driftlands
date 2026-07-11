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

/** Realtime channel event envelopes (Ably / WS). */
export type RealtimeEvent =
  | { type: "journey.started"; payload: { journeyId: JourneyId; seed: number } }
  | { type: "player.moved"; payload: { playerId: string; zoneIndex: number; position: { x: number; y: number; z: number } } }
  | { type: "hazard.resolved"; payload: HazardRollResult }
  | { type: "player.died"; payload: { playerId: string; reviveFeeDrift: number; reviveCount: number } }
  | { type: "player.revived"; payload: { playerId: string; reviveCount: number } }
  | { type: "artifact.looted"; payload: EquippedArtifact & { playerId: string } }
  | { type: "odds_pool.opened"; payload: OddsPoolView }
  | { type: "odds_pool.resolved"; payload: OddsPoolView }
  | { type: "journey.ended"; payload: JourneyResultPayload };
