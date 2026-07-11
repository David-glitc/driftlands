"use client";

import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(useGSAP);

type Props = {
  end: { survived: boolean; reputationDelta: number; resultHash: string };
  onAgain: () => void;
};

export function ResultBanner({ end, onAgain }: Props) {
  const rootRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      gsap.from(".dl-result", {
        autoAlpha: 0,
        y: -16,
        duration: 0.5,
        ease: "power3.out",
      });
    },
    { scope: rootRef },
  );

  return (
    <div ref={rootRef} style={styles.wrap}>
      <div
        className="dl-result"
        style={{
          ...styles.banner,
          background: end.survived ? "#3ddc97" : "#ff5c8a",
        }}
      >
        <div>
          <strong>{end.survived ? "Survived the drift" : "Permadeath"}</strong>
          <p style={styles.meta}>
            Reputation {end.reputationDelta >= 0 ? "+" : ""}
            {end.reputationDelta} · hash {end.resultHash.slice(0, 10)}…
          </p>
        </div>
        <button type="button" style={styles.btn} onClick={onAgain}>
          New journey
        </button>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  wrap: {
    position: "fixed",
    top: 16,
    left: 16,
    right: 16,
    zIndex: 50,
    display: "flex",
    justifyContent: "center",
    pointerEvents: "none",
  },
  banner: {
    pointerEvents: "auto",
    display: "flex",
    gap: 16,
    alignItems: "center",
    justifyContent: "space-between",
    border: "3px solid #1b1f3b",
    borderRadius: 18,
    padding: "12px 16px",
    maxWidth: 640,
    width: "100%",
    color: "#1b1f3b",
    boxShadow: "0 8px 0 #1b1f3b",
    willChange: "transform, opacity",
  },
  meta: { margin: "4px 0 0", fontSize: 13, fontWeight: 600, opacity: 0.85 },
  btn: {
    border: "2px solid #1b1f3b",
    background: "#fff1d6",
    borderRadius: 999,
    padding: "8px 14px",
    fontWeight: 800,
    whiteSpace: "nowrap",
  },
};
