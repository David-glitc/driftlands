"use client";

import { useMemo, useState } from "react";
import type { ArtifactCategory, ArtifactRank, EquippedArtifact } from "@driftlands/shared";
import { getArtifactById, RANK_META } from "@driftlands/shared";

type Props = {
  inventory: EquippedArtifact[];
  open: boolean;
  onClose: () => void;
};

const CATEGORIES: Array<ArtifactCategory | "all"> = ["all", "armor", "food", "tool", "charm"];
const RANKS: Array<ArtifactRank | "all"> = [
  "all",
  "common",
  "uncommon",
  "rare",
  "epic",
  "legendary",
];

export function InventoryPanel({ inventory, open, onClose }: Props) {
  const [category, setCategory] = useState<(typeof CATEGORIES)[number]>("all");
  const [rank, setRank] = useState<(typeof RANKS)[number]>("all");

  const filtered = useMemo(() => {
    return inventory.filter((item) => {
      const def = getArtifactById(item.artifactId);
      if (!def) return false;
      if (category !== "all" && def.category !== category) return false;
      if (rank !== "all" && def.rank !== rank) return false;
      return true;
    });
  }, [inventory, category, rank]);

  if (!open) return null;

  return (
    <div style={styles.backdrop} role="dialog" aria-labelledby="inv-title">
      <div style={styles.panel}>
        <div style={styles.head}>
          <div>
            <h2 id="inv-title" style={styles.title}>
              Fragments of old certainty
            </h2>
            <p style={styles.sub}>What the dunes still remember.</p>
          </div>
          <button type="button" style={styles.close} onClick={onClose}>
            Close
          </button>
        </div>

        <div style={styles.filters}>
          {CATEGORIES.map((c) => (
            <button
              key={c}
              type="button"
              style={{ ...styles.filter, ...(category === c ? styles.filterOn : null) }}
              onClick={() => setCategory(c)}
            >
              {c}
            </button>
          ))}
        </div>
        <div style={styles.filters}>
          {RANKS.map((r) => (
            <button
              key={r}
              type="button"
              style={{ ...styles.filter, ...(rank === r ? styles.filterOn : null) }}
              onClick={() => setRank(r)}
            >
              {r}
            </button>
          ))}
        </div>

        <div style={styles.grid}>
          {filtered.length === 0 && <p style={styles.empty}>No fragments in this filter.</p>}
          {filtered.map((item) => {
            const def = getArtifactById(item.artifactId);
            if (!def) return null;
            return (
              <div
                key={item.instanceId}
                style={{
                  ...styles.card,
                  borderColor: RANK_META[def.rank].border,
                  background: def.color,
                }}
              >
                <strong style={styles.name}>{def.displayName}</strong>
                <span style={styles.meta}>
                  {def.rank} · {def.category} · z{item.acquiredAtZone + 1}
                </span>
                <span style={styles.stats}>
                  P{def.stats.power} V{def.stats.vitality} F{def.stats.focus} L{def.stats.luck} W
                  {def.stats.weight}
                </span>
                <p style={styles.flavor}>{def.flavorText}</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  backdrop: {
    pointerEvents: "auto",
    position: "absolute",
    inset: 0,
    background: "rgba(27, 31, 59, 0.4)",
    display: "grid",
    placeItems: "center",
    padding: 16,
    zIndex: 30,
  },
  panel: {
    width: "min(720px, 100%)",
    maxHeight: "80vh",
    overflow: "auto",
    background: "#fff1d6",
    border: "3px solid #1b1f3b",
    borderRadius: 20,
    padding: 18,
    boxShadow: "0 12px 0 #1b1f3b",
  },
  head: { display: "flex", justifyContent: "space-between", gap: 12, alignItems: "flex-start" },
  title: { margin: 0, fontFamily: '"Space Grotesk", sans-serif', fontSize: 22, color: "#1b1f3b" },
  sub: { margin: "4px 0 0", color: "#3d4466", fontSize: 13, fontWeight: 600 },
  close: {
    border: "2px solid #1b1f3b",
    background: "#ffd166",
    borderRadius: 10,
    padding: "8px 12px",
    fontWeight: 800,
    cursor: "pointer",
  },
  filters: { display: "flex", flexWrap: "wrap", gap: 6, marginTop: 12 },
  filter: {
    border: "2px solid #1b1f3b",
    background: "#fff",
    borderRadius: 999,
    padding: "4px 10px",
    fontSize: 11,
    fontWeight: 700,
    textTransform: "capitalize",
    cursor: "pointer",
  },
  filterOn: { background: "#ff6b4a", color: "#fff" },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
    gap: 10,
    marginTop: 14,
  },
  empty: { gridColumn: "1 / -1", color: "#3d4466", fontWeight: 600 },
  card: {
    border: "3px solid #9ca3af",
    borderRadius: 14,
    padding: 10,
    color: "#1b1f3b",
    display: "flex",
    flexDirection: "column",
    gap: 4,
  },
  name: { fontSize: 13, fontFamily: '"Space Grotesk", sans-serif' },
  meta: { fontSize: 10, fontWeight: 700, opacity: 0.8, textTransform: "capitalize" },
  stats: { fontSize: 10, fontWeight: 800, letterSpacing: "0.02em" },
  flavor: { margin: "4px 0 0", fontSize: 11, lineHeight: 1.35, opacity: 0.85 },
};
