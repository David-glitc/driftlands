"use client";

import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import type { JourneyNode, PlayerSession } from "@driftlands/shared";
import { getArtifactById } from "@driftlands/shared";

type Props = {
  session: PlayerSession;
  currentNode?: JourneyNode;
  log: string[];
  busy: boolean;
  canAdvance: boolean;
  onAdvance: () => void;
};

export function Hud({ session, currentNode, log, busy, canAdvance, onAdvance }: Props) {
  const rootRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      gsap.from(".dl-hud-panel", {
        autoAlpha: 0,
        y: 24,
        duration: 0.55,
        ease: "power3.out",
      });
    },
    { scope: rootRef },
  );

  useGSAP(
    () => {
      gsap.from(".dl-chip", {
        autoAlpha: 0,
        scale: 0.85,
        stagger: 0.06,
        duration: 0.35,
        ease: "back.out(1.6)",
        overwrite: "auto",
      });
    },
    { scope: rootRef, dependencies: [session.inventory.length], revertOnUpdate: true },
  );

  return (
    <div ref={rootRef} style={styles.wrap}>
      <div className="dl-hud-panel" style={styles.panel}>
        <div style={styles.row}>
          <Stat label="Level" value={session.levelScore.toFixed(1)} />
          <Stat label="Zone" value={`${session.zoneIndex + 1}`} />
          <Stat label="Revives" value={`${session.reviveCount}/3`} />
          <Stat label="Rep" value={`${session.reputation}`} />
        </div>
        <p style={styles.node}>
          {currentNode ? (
            <>
              <strong>{currentNode.label}</strong>
              <span style={{ opacity: 0.75 }}>
                {" "}
                · {currentNode.kind} · diff {currentNode.difficulty}
              </span>
            </>
          ) : (
            "—"
          )}
        </p>
        <div style={styles.inv}>
          {session.inventory.length === 0 && <span style={styles.muted}>No artifacts yet</span>}
          {session.inventory.map((item) => {
            const def = getArtifactById(item.artifactId);
            return (
              <span
                key={item.instanceId}
                className="dl-chip"
                style={{ ...styles.chip, background: def?.color ?? "#ffd166" }}
              >
                {def?.displayName ?? item.artifactId}
              </span>
            );
          })}
        </div>
        <button type="button" disabled={!canAdvance || busy} onClick={onAdvance} style={styles.advance}>
          {busy ? "Resolving…" : "Push Forward"}
        </button>
        <ul style={styles.log}>
          {log.map((line, i) => (
            <li key={`${i}-${line}`}>{line}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div style={styles.statLabel}>{label}</div>
      <div style={styles.statValue}>{value}</div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  wrap: {
    position: "absolute",
    left: 16,
    right: 16,
    bottom: 16,
    pointerEvents: "none",
  },
  panel: {
    pointerEvents: "auto",
    maxWidth: 420,
    background: "rgba(255, 241, 214, 0.92)",
    border: "3px solid #1b1f3b",
    borderRadius: 20,
    padding: 14,
    backdropFilter: "blur(8px)",
    willChange: "transform, opacity",
  },
  row: { display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8, marginBottom: 10 },
  statLabel: { fontSize: 11, fontWeight: 700, textTransform: "uppercase", opacity: 0.6 },
  statValue: { fontWeight: 800, fontSize: 18 },
  node: { margin: "0 0 10px", fontSize: 14 },
  inv: { display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 10, minHeight: 28 },
  chip: {
    border: "2px solid #1b1f3b",
    borderRadius: 999,
    padding: "2px 10px",
    fontSize: 12,
    fontWeight: 700,
    willChange: "transform, opacity",
  },
  muted: { fontSize: 13, opacity: 0.6 },
  advance: {
    width: "100%",
    border: "3px solid #1b1f3b",
    background: "#ff6b4a",
    color: "#fff",
    borderRadius: 14,
    padding: "12px 14px",
    fontWeight: 800,
    fontSize: 16,
    boxShadow: "0 5px 0 #1b1f3b",
  },
  log: {
    margin: "10px 0 0",
    padding: 0,
    listStyle: "none",
    fontSize: 12,
    color: "#3d4466",
    maxHeight: 72,
    overflow: "auto",
  },
};
