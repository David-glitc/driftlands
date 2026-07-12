"use client";

import type { OddsPoolView } from "@driftlands/shared";

type Props = {
  pool: OddsPoolView;
  onEnter: (outcomeId: string) => void;
};

export function OddsPoolPanel({ pool, onEnter }: Props) {
  return (
    <aside style={styles.wrap} aria-label="Odds pool">
      <p style={styles.title}>Live pool</p>
      <p style={styles.sub}>0.5 $DRIFT · fee {(pool.feeBps / 100).toFixed(0)}%</p>
      <div style={styles.row}>
        {pool.outcomes.map((o) => (
          <button key={o.outcomeId} type="button" style={styles.btn} onClick={() => onEnter(o.outcomeId)}>
            <strong>{o.label}</strong>
            <span style={styles.amt}>{o.totalStaked.toFixed(1)} in</span>
          </button>
        ))}
      </div>
    </aside>
  );
}

const styles: Record<string, React.CSSProperties> = {
  wrap: {
    position: "absolute",
    top: 64,
    right: 16,
    background: "rgba(20, 24, 40, 0.92)",
    border: "1px solid rgba(255,255,255,0.18)",
    borderRadius: 16,
    padding: 12,
    maxWidth: 260,
    color: "#fff",
    zIndex: 20,
  },
  title: { margin: 0, fontWeight: 800, fontSize: 13 },
  sub: { margin: "4px 0 10px", fontSize: 11, opacity: 0.7 },
  row: { display: "flex", flexDirection: "column", gap: 8 },
  btn: {
    textAlign: "left",
    border: "1px solid rgba(255,255,255,0.18)",
    borderRadius: 12,
    padding: "8px 10px",
    background: "rgba(255,255,255,0.08)",
    color: "#fff",
    display: "flex",
    flexDirection: "column",
    gap: 2,
    fontFamily: "inherit",
  },
  amt: { fontSize: 11, opacity: 0.75 },
};
