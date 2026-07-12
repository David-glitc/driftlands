"use client";

import type { JourneyNode, PlayerSession } from "@driftlands/shared";
import { sumInventoryStats } from "@driftlands/shared";
import { ArtifactBelt } from "@/components/ArtifactBelt";
import { InventoryPanel } from "@/components/InventoryPanel";

type Props = {
  session: PlayerSession;
  currentNode?: JourneyNode;
  totalNodes: number;
  log: string[];
  busy: boolean;
  canAdvance: boolean;
  onAdvance: () => void;
  inventoryOpen: boolean;
  onInventoryOpenChange: (open: boolean) => void;
  showHotkeyHints?: boolean;
};

export function Hud({
  session,
  currentNode,
  totalNodes,
  log,
  busy,
  canAdvance,
  onAdvance,
  inventoryOpen,
  onInventoryOpenChange,
  showHotkeyHints = true,
}: Props) {
  const progress = Math.min(100, ((session.zoneIndex + 1) / Math.max(1, totalNodes)) * 100);
  const stats = sumInventoryStats(session.inventory);

  return (
    <div style={styles.wrap}>
      <div style={styles.top}>
        <div style={styles.pill}>
          <span style={styles.muted}>ZONE</span>
          <strong>{session.zoneIndex + 1}</strong>
        </div>
        <div style={styles.barTrack}>
          <div style={{ ...styles.barFill, width: `${progress}%` }} />
        </div>
        <div style={styles.pill}>
          <span style={styles.muted}>LVL</span>
          <strong>{session.levelScore.toFixed(0)}</strong>
        </div>
      </div>

      <div style={styles.statsRow}>
        <span>Power {stats.power}</span>
        <span>Vitality {stats.vitality}</span>
        <span>Focus {stats.focus}</span>
        <span>Luck {stats.luck}</span>
        <span>Weight {stats.weight}</span>
      </div>

      <div style={styles.beltAnchor}>
        <ArtifactBelt
          inventory={session.inventory}
          onOpenInventory={() => onInventoryOpenChange(true)}
        />
      </div>

      <div style={styles.bottom}>
        <div style={styles.panel}>
          <p style={styles.nodeTitle}>{currentNode?.label ?? "Open dunes"}</p>
          <p style={styles.nodeMeta}>
            {currentNode ? `${currentNode.kind} · difficulty ${currentNode.difficulty}` : "—"}
            {" · "}
            revives {session.reviveCount}/3
          </p>
          {log[0] && <p style={styles.logLine}>{log[0]}</p>}
          {showHotkeyHints && (
            <p style={styles.hintLine}>Space advance · I fragments · S settings · ? keys</p>
          )}
        </div>
        <button type="button" disabled={!canAdvance || busy} onClick={onAdvance} style={styles.advance}>
          {busy ? "Resolving…" : "Advance"}
        </button>
      </div>

      <InventoryPanel
        inventory={session.inventory}
        open={inventoryOpen}
        onClose={() => onInventoryOpenChange(false)}
      />
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  wrap: {
    position: "absolute",
    inset: 0,
    pointerEvents: "none",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    padding: 16,
  },
  top: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    maxWidth: 520,
    margin: "0 auto",
    width: "100%",
  },
  pill: {
    pointerEvents: "auto",
    background: "rgba(20, 24, 40, 0.72)",
    color: "#fff",
    borderRadius: 999,
    padding: "8px 12px",
    display: "flex",
    gap: 6,
    alignItems: "baseline",
    fontSize: 14,
  },
  muted: { opacity: 0.65, fontSize: 11, fontWeight: 700, letterSpacing: "0.06em" },
  barTrack: {
    flex: 1,
    height: 8,
    borderRadius: 999,
    background: "rgba(20,24,40,0.35)",
    overflow: "hidden",
  },
  barFill: {
    height: "100%",
    background: "linear-gradient(90deg, #ff6b4a, #ffd166)",
    borderRadius: 999,
  },
  statsRow: {
    pointerEvents: "auto",
    position: "absolute",
    top: 64,
    left: 16,
    display: "flex",
    flexWrap: "wrap",
    gap: 8,
    background: "rgba(20, 24, 40, 0.72)",
    color: "#ffe8c2",
    borderRadius: 12,
    padding: "8px 12px",
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: "0.02em",
    maxWidth: "min(420px, calc(100% - 32px))",
  },
  beltAnchor: {
    position: "absolute",
    left: 16,
    bottom: 16,
    zIndex: 2,
  },
  bottom: {
    display: "flex",
    gap: 12,
    alignItems: "flex-end",
    maxWidth: 720,
    width: "100%",
    margin: "0 auto 0 220px",
  },
  panel: {
    pointerEvents: "auto",
    flex: 1,
    background: "rgba(20, 24, 40, 0.78)",
    color: "#fff",
    borderRadius: 18,
    padding: "14px 16px",
    border: "1px solid rgba(255,255,255,0.12)",
  },
  nodeTitle: { margin: 0, fontSize: 18, fontWeight: 800, fontFamily: '"Space Grotesk", sans-serif' },
  nodeMeta: { margin: "4px 0 0", fontSize: 12, opacity: 0.75 },
  logLine: { margin: "10px 0 0", fontSize: 12, opacity: 0.8 },
  hintLine: { margin: "8px 0 0", fontSize: 11, opacity: 0.55, fontWeight: 600 },
  advance: {
    pointerEvents: "auto",
    border: "none",
    background: "linear-gradient(135deg, #ff6b4a, #e84a2f)",
    color: "#fff",
    borderRadius: 16,
    padding: "18px 28px",
    fontWeight: 800,
    fontSize: 16,
    boxShadow: "0 12px 32px rgba(232, 74, 47, 0.45)",
    whiteSpace: "nowrap",
  },
};
