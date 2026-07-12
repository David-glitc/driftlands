import { z } from "zod";

export const ArtifactCategorySchema = z.enum(["armor", "food", "tool", "charm"]);
export const ArtifactRankSchema = z.enum([
  "common",
  "uncommon",
  "rare",
  "epic",
  "legendary",
]);
export const ModifierTypeSchema = z.enum([
  "general_survival",
  "storm_resist",
  "ambush_resist",
  "fire_hazard_resist",
  "resource_boost",
  "revive_discount",
]);

export const ArtifactDefinitionSchema = z.object({
  artifact_id: z.string().min(1),
  category: ArtifactCategorySchema,
  rank: ArtifactRankSchema,
  rank_tier: z.number().int().min(1).max(5),
  survival_modifier: z.number(),
  modifier_type: ModifierTypeSchema,
  stack_limit: z.number().int().min(1),
  drop_weight: z.number().positive(),
  min_journey_zone: z.number().int().min(0),
  revive_discount: z.number().min(0).max(1).default(0),
  flavor_text: z.string(),
  display_name: z.string(),
  color: z.string().optional(),
  stats: z.object({
    power: z.number().min(0).max(100),
    vitality: z.number().min(0).max(100),
    focus: z.number().min(0).max(100),
    luck: z.number().min(0).max(100),
    weight: z.number().min(0).max(100),
  }),
});

export const ArtifactCatalogSchema = z.object({
  config_version: z.string(),
  artifacts: z.array(ArtifactDefinitionSchema).min(1),
});

export const StakeAssetSchema = z.object({
  mint: z.string(),
  symbol: z.string(),
  token_multiplier: z.number().positive(),
  decimals: z.number().int().min(0).max(9),
  is_sanctum_lst: z.boolean(),
});

export const BalancingConfigSchema = z.object({
  config_version: z.string(),
  revive: z.object({
    base_fee_drift: z.number().positive(),
    multipliers: z.array(z.number().positive()).min(1),
    max_revives_per_journey: z.number().int().min(1).max(10),
  }),
  odds_pool: z.object({
    fee_bps: z.number().int().min(0).max(5000),
    min_buy_in: z.number().positive(),
    min_players_to_open: z.number().int().min(1),
  }),
  level: z.object({
    min_usd_stake: z.number().positive(),
    duration_tiers: z.array(
      z.object({
        min_seconds: z.number().nonnegative(),
        multiplier: z.number().positive(),
      }),
    ),
  }),
  reputation: z.object({
    survive_bonus: z.number(),
    death_penalty: z.number(),
    daily_decay: z.number().min(0).max(1),
  }),
  artifacts: z.object({
    max_item_bonus: z.number().positive(),
    weight_soft_cap: z.number().positive(),
    weight_penalty_per_point: z.number().nonnegative(),
    max_weight_penalty: z.number().nonnegative(),
    vitality_to_bonus: z.number().nonnegative(),
    focus_to_bonus: z.number().nonnegative(),
  }),
  stake_assets: z.array(StakeAssetSchema).min(1),
});

export type ArtifactCatalogInput = z.infer<typeof ArtifactCatalogSchema>;
export type BalancingConfigInput = z.infer<typeof BalancingConfigSchema>;
