"use client";

import type { OddsPoolView } from "@driftlands/shared";

type Props = {
  pool: OddsPoolView;
  onEnter: (outcomeId: string) => void;
};

export function OddsPoolPanel({ pool, onEnter }: Props) {
  return (
    <aside style={styles.wrap} aria-label="Odds pool">
      <p style={styles.title}>Players-only pool</p>
      <p style={styles.sub}>Buy in 0.5 $DRIFT · fee {(pool.feeBps / 100).toFixed(1)}%</p>
      <div style={styles.row}>
        {pool.outcomes.map((o) => (
          <button key={o.outcomeId} type="button" style={styles.btn} onClick={() => onEnter(o.outcomeId)}>
            <strong>{o.label}</strong>
            <span style={styles.amt}>{o.totalStaked.toFixed(1)} staked</span>
          </button>
        ))}
      </div>
    </aside>
  );
}

const styles: Record<string, React.CSSProperties> = {
  wrap: {
    position: "absolute",
    top: 16,
    right: 16,
    background: "rgba(46, 196, 182, 0.92)",
    border: "3px solid #1b1f3b",
    borderRadius: 18,
    padding: 12,
    maxWidth: 280,
    color: "#1b1f3b",
  },
  title: { margin: 0, fontWeight: 800, fontSize: 14 },
  sub: { margin: "4px 0 10px", fontSize: 12, opacity: 0.85 },
  row: { display: "flex", flexDirection: "column", gap: 8 },
  btn: {
    textAlign: "left",
    border: "2px solid #1b1f3b",
    borderRadius: 12,
    padding: "8px 10px",
    background: "#fff1d6",
    display: "flex",
    flexDirection: "column",
    gap: 2,
    fontFamily: "inherit",
  },
  amt: { fontSize: 11, fontWeight: 600 },
};
