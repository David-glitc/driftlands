"use client";

import { useMemo, useState } from "react";
import { BALANCING, type LevelStateView } from "@driftlands/shared";
import {
  DURATION_PRESETS,
  previewLevelScore,
  saveDemoLevel,
  type DemoStakeDraft,
} from "@/lib/demoStake";

type Props = {
  playerId: string;
  level: LevelStateView | null;
  onLevel: (level: LevelStateView) => void;
};

export function DemoStakePanel({ playerId, level, onLevel }: Props) {
  const [symbol, setSymbol] = useState(BALANCING.stake_assets[0]?.symbol ?? "DRIFT");
  const [usd, setUsd] = useState(25);
  const [durationSeconds, setDurationSeconds] = useState(86_400);

  const draft: DemoStakeDraft = { symbol, usdValue: usd, durationSeconds };
  const preview = useMemo(() => previewLevelScore(draft), [symbol, usd, durationSeconds]);

  const confirm = () => {
    const next = { ...previewLevelScore(draft), player: playerId || "Wanderer" };
    saveDemoLevel(next);
    onLevel(next);
  };

  return (
    <section style={styles.panel} aria-labelledby="stake-title">
      <div style={styles.head}>
        <h2 id="stake-title" style={styles.title}>
          Stake for Level Score
        </h2>
        <p style={styles.sub}>
          Demo lock — scores feed survival odds. Live Sanctum LST wiring comes later.
        </p>
      </div>

      <label style={styles.label}>
        Asset
        <select
          value={symbol}
          onChange={(e) => setSymbol(e.target.value)}
          style={styles.select}
        >
          {BALANCING.stake_assets.map((a) => (
            <option key={a.symbol} value={a.symbol}>
              {a.symbol}
              {a.is_sanctum_lst ? " · Sanctum LST" : ""} · ×{a.token_multiplier}
            </option>
          ))}
        </select>
      </label>

      <label style={styles.label}>
        USD value (demo)
        <input
          type="number"
          min={BALANCING.level.min_usd_stake}
          step={1}
          value={usd}
          onChange={(e) => setUsd(Number(e.target.value) || BALANCING.level.min_usd_stake)}
          style={styles.input}
        />
      </label>

      <div style={styles.durations}>
        {DURATION_PRESETS.map((p) => (
          <button
            key={p.seconds}
            type="button"
            style={{
              ...styles.chip,
              ...(durationSeconds === p.seconds ? styles.chipOn : null),
            }}
            onClick={() => setDurationSeconds(p.seconds)}
          >
            {p.label}
          </button>
        ))}
      </div>

      <div style={styles.scoreBox}>
        <span style={styles.muted}>Preview Level Score</span>
        <strong style={styles.score}>{preview.levelScore.toFixed(2)}</strong>
        <span style={styles.meta}>
          ln(${preview.usdValueStaked}) × {preview.durationMultiplier} × {preview.tokenMultiplier}
        </span>
      </div>

      <button type="button" style={styles.confirm} onClick={confirm}>
        {level ? "Update demo stake" : "Confirm demo stake"}
      </button>

      {level && (
        <p style={styles.active}>
          Active score <strong>{level.levelScore.toFixed(2)}</strong> · {symbol} stake feeds your next
          journey.
        </p>
      )}
    </section>
  );
}

const styles: Record<string, React.CSSProperties> = {
  panel: {
    margin: "0 0 18px",
    padding: 14,
    border: "3px solid #1b1f3b",
    borderRadius: 16,
    background: "rgba(255,241,214,0.92)",
    boxShadow: "0 6px 0 #1b1f3b",
  },
  head: { marginBottom: 12 },
  title: {
    margin: 0,
    fontFamily: '"Space Grotesk", sans-serif',
    fontSize: 18,
    color: "#1b1f3b",
  },
  sub: { margin: "4px 0 0", fontSize: 12, color: "#3d4466", fontWeight: 600 },
  label: {
    display: "flex",
    flexDirection: "column",
    gap: 6,
    fontWeight: 700,
    fontSize: 13,
    marginBottom: 10,
    color: "#1b1f3b",
  },
  select: {
    border: "2px solid #1b1f3b",
    borderRadius: 10,
    padding: "10px 12px",
    fontSize: 14,
    fontFamily: "inherit",
    background: "#fff",
  },
  input: {
    border: "2px solid #1b1f3b",
    borderRadius: 10,
    padding: "10px 12px",
    fontSize: 14,
    fontFamily: "inherit",
    background: "#fff",
  },
  durations: { display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 12 },
  chip: {
    border: "2px solid #1b1f3b",
    background: "#fff",
    borderRadius: 999,
    padding: "6px 12px",
    fontWeight: 700,
    fontSize: 12,
    cursor: "pointer",
  },
  chipOn: { background: "#2ec4b6", color: "#1b1f3b" },
  scoreBox: {
    display: "flex",
    flexDirection: "column",
    gap: 2,
    marginBottom: 12,
    padding: "10px 12px",
    borderRadius: 12,
    background: "rgba(27,31,59,0.06)",
  },
  muted: { fontSize: 11, fontWeight: 700, letterSpacing: "0.06em", color: "#3d4466" },
  score: { fontSize: 28, fontFamily: '"Space Grotesk", sans-serif', color: "#1b1f3b" },
  meta: { fontSize: 11, color: "#3d4466", fontWeight: 600 },
  confirm: {
    width: "100%",
    border: "3px solid #1b1f3b",
    background: "#ffd166",
    borderRadius: 12,
    padding: "12px 14px",
    fontWeight: 800,
    fontSize: 14,
    cursor: "pointer",
    boxShadow: "0 4px 0 #1b1f3b",
  },
  active: { margin: "10px 0 0", fontSize: 12, color: "#1b7a52", fontWeight: 700 },
};
