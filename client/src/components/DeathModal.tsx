"use client";

import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(useGSAP);

type Props = {
  fee: number | null;
  reviveCount: number;
  busy: boolean;
  onRevive: () => void;
  itemBonus?: number | null;
};

export function DeathModal({ fee, reviveCount, busy, onRevive, itemBonus = null }: Props) {
  const rootRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      gsap.from(".dl-death-panel", {
        autoAlpha: 0,
        scale: 0.92,
        y: 20,
        duration: 0.45,
        ease: "back.out(1.4)",
      });
    },
    { scope: rootRef },
  );

  const bonusPct =
    itemBonus != null && itemBonus > 0 ? Math.round(itemBonus * 100) : null;

  return (
    <div ref={rootRef} style={styles.backdrop}>
      <div className="dl-death-panel" style={styles.panel} role="dialog" aria-labelledby="death-title">
        <h2 id="death-title" style={styles.title}>
          You fell in the dunes
        </h2>
        <p style={styles.body}>
          Revive #{reviveCount + 1} of 3
          {fee != null ? ` · ${fee} $DRIFT` : " · cap reached"}
        </p>
        {bonusPct != null && (
          <p style={styles.hint}>Fragments bought you +{bonusPct}% on this roll.</p>
        )}
        <button type="button" disabled={busy || fee == null} style={styles.btn} onClick={onRevive}>
          {busy ? "Paying…" : fee == null ? "No revives left" : `Pay ${fee} $DRIFT (demo)`}
        </button>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  backdrop: {
    position: "fixed",
    inset: 0,
    background: "rgba(27, 31, 59, 0.45)",
    display: "grid",
    placeItems: "center",
    zIndex: 40,
    padding: 20,
  },
  panel: {
    background: "#fff1d6",
    border: "3px solid #1b1f3b",
    borderRadius: 24,
    padding: 28,
    maxWidth: 400,
    width: "100%",
    boxShadow: "0 14px 0 #1b1f3b",
    willChange: "transform, opacity",
  },
  title: { margin: "0 0 8px", fontFamily: '"Space Grotesk", sans-serif', fontSize: 28 },
  body: { margin: "0 0 10px", color: "#3d4466", fontWeight: 600 },
  hint: { margin: "0 0 18px", color: "#1b7a52", fontWeight: 700, fontSize: 13 },
  btn: {
    width: "100%",
    border: "3px solid #1b1f3b",
    background: "#ff4d6d",
    color: "#fff",
    borderRadius: 14,
    padding: "14px 16px",
    fontWeight: 800,
    fontSize: 16,
  },
};
