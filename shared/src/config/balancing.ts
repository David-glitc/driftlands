import { BalancingConfigSchema } from "../schemas.js";

/** V1 balancing — tunable without redeploying game logic. */
export const BALANCING_RAW = {
  config_version: "balancing-v1.1.0",
  revive: {
    base_fee_drift: 1,
    multipliers: [1, 2.5, 6],
    max_revives_per_journey: 3,
  },
  odds_pool: {
    fee_bps: 1500,
    min_buy_in: 0.1,
    min_players_to_open: 1,
  },
  level: {
    min_usd_stake: 1,
    duration_tiers: [
      { min_seconds: 0, multiplier: 1.0 },
      { min_seconds: 86_400, multiplier: 1.15 },
      { min_seconds: 604_800, multiplier: 1.35 },
      { min_seconds: 2_592_000, multiplier: 1.6 },
    ],
  },
  reputation: {
    survive_bonus: 25,
    death_penalty: -10,
    daily_decay: 0.02,
  },
  artifacts: {
    max_item_bonus: 0.55,
    weight_soft_cap: 40,
    weight_penalty_per_point: 0.002,
    max_weight_penalty: 0.08,
    vitality_to_bonus: 0.0008,
    focus_to_bonus: 0.0012,
  },
  stake_assets: [
    {
      mint: "DRIFT_MINT_PLACEHOLDER",
      symbol: "DRIFT",
      token_multiplier: 2.0,
      decimals: 9,
      is_sanctum_lst: false,
    },
    {
      mint: "INF_MINT_PLACEHOLDER",
      symbol: "INF",
      token_multiplier: 1.25,
      decimals: 9,
      is_sanctum_lst: true,
    },
    {
      mint: "JITOSOL_MINT_PLACEHOLDER",
      symbol: "jitoSOL",
      token_multiplier: 1.15,
      decimals: 9,
      is_sanctum_lst: true,
    },
  ],
};

export const BALANCING = BalancingConfigSchema.parse(BALANCING_RAW);

export const GAME_CONFIG_VERSION = `${BALANCING.config_version}+artifacts-v1.1.0`;
