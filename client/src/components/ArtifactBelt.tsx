"use client";

import { useState } from "react";
import type { EquippedArtifact } from "@driftlands/shared";
import { getArtifactById, RANK_META, topEquippedForBelt } from "@driftlands/shared";

type Props = {
  inventory: EquippedArtifact[];
  onOpenInventory: () => void;
};

export function ArtifactBelt({ inventory, onOpenInventory }: Props) {
  const belt = topEquippedForBelt(inventory, 4);
  const [hover, setHover] = useState<string | null>(null);

  return (
    <div style={styles.wrap}>
      <button type="button" style={styles.labelBtn} onClick={onOpenInventory} title="Open fragments">
        Fragments
      </button>
      <div style={styles.slots}>
        {Array.from({ length: 4 }).map((_, i) => {
          const item = belt[i];
          const def = item ? getArtifactById(item.artifactId) : undefined;
          const border = def ? RANK_META[def.rank].border : "rgba(255,255,255,0.25)";
          return (
            <div
              key={item?.instanceId ?? `empty-${i}`}
              style={{
                ...styles.slot,
                borderColor: border,
                background: def?.color ?? "rgba(20,24,40,0.55)",
              }}
              onMouseEnter={() => setHover(item?.instanceId ?? null)}
              onMouseLeave={() => setHover(null)}
            >
              {def ? (
                <span style={styles.glyph}>{def.category[0]!.toUpperCase()}</span>
              ) : (
                <span style={styles.empty}>·</span>
              )}
              {hover === item?.instanceId && def && (
                <div style={styles.tip}>
                  <strong>{def.displayName}</strong>
                  <span>
                    {def.rank} · {def.flavorText}
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  wrap: {
    pointerEvents: "auto",
    display: "flex",
    flexDirection: "column",
    gap: 8,
    alignItems: "flex-start",
  },
  labelBtn: {
    border: "1px solid rgba(255,255,255,0.2)",
    background: "rgba(20, 24, 40, 0.72)",
    color: "#ffe8c2",
    borderRadius: 8,
    padding: "4px 10px",
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    cursor: "pointer",
  },
  slots: { display: "flex", gap: 8 },
  slot: {
    position: "relative",
    width: 48,
    height: 48,
    borderRadius: 10,
    border: "3px solid #9ca3af",
    display: "grid",
    placeItems: "center",
    boxShadow: "0 6px 0 rgba(27,31,59,0.35)",
  },
  glyph: {
    fontWeight: 800,
    fontSize: 16,
    color: "#1b1f3b",
    fontFamily: '"Space Grotesk", sans-serif',
  },
  empty: { opacity: 0.35, color: "#fff", fontSize: 18 },
  tip: {
    position: "absolute",
    left: 0,
    bottom: "110%",
    minWidth: 180,
    maxWidth: 240,
    background: "rgba(20,24,40,0.95)",
    color: "#fff",
    borderRadius: 10,
    padding: "8px 10px",
    fontSize: 11,
    display: "flex",
    flexDirection: "column",
    gap: 4,
    zIndex: 5,
    border: "1px solid rgba(255,255,255,0.15)",
  },
};
