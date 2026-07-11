"use client";

import dynamic from "next/dynamic";
import { useRef, useState } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(useGSAP);

const WalletBar = dynamic(() => import("./WalletBar").then((m) => m.WalletBar), { ssr: false });

type Props = {
  playerId: string;
  onPlayerId: (id: string) => void;
  onStart: (difficulty: "easy" | "standard" | "hard") => void;
  busy: boolean;
  error: string | null;
};

export function Landing({ playerId, onPlayerId, onStart, busy, error }: Props) {
  const rootRef = useRef<HTMLElement>(null);
  const [showGuest, setShowGuest] = useState(true);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(
        {
          reduce: "(prefers-reduced-motion: reduce)",
          motion: "(prefers-reduced-motion: no-preference)",
        },
        (ctx) => {
          const { reduce } = ctx.conditions as { reduce: boolean };
          if (reduce) {
            gsap.set([".dl-brand", ".dl-headline", ".dl-lead", ".dl-cta", ".dl-orb"], {
              autoAlpha: 1,
              y: 0,
              scale: 1,
            });
            return;
          }
          const tl = gsap.timeline({
            defaults: { ease: "power3.out", duration: 0.7 },
          });
          tl.from(".dl-brand", { autoAlpha: 0, y: 28, scale: 0.96 })
            .from(".dl-headline", { autoAlpha: 0, y: 16 }, "-=0.45")
            .from(".dl-lead", { autoAlpha: 0, y: 12 }, "-=0.4")
            .from(".dl-cta", { autoAlpha: 0, y: 10, stagger: 0.08 }, "-=0.35");
          gsap.to(".dl-orb", {
            y: -18,
            scale: 1.04,
            duration: 3.2,
            ease: "sine.inOut",
            yoyo: true,
            repeat: -1,
          });
        },
      );
      return () => mm.revert();
    },
    { scope: rootRef },
  );

  return (
    <main ref={rootRef} style={styles.page}>
      <WalletBar
        playerId={playerId}
        onPlayerId={(id) => {
          onPlayerId(id);
          // Hide guest field once a wallet address is synced
          if (id.length > 32) setShowGuest(false);
        }}
      />
      <div style={styles.hero}>
        <p className="dl-brand" style={styles.brand}>
          DRIFTLANDS
        </p>
        <h1 className="dl-headline" style={styles.headline}>
          Stake. Survive. Drift.
        </h1>
        <p className="dl-lead" style={styles.lead}>
          A bright coral-dune survival journey. Chain settles stakes, revives, and odds pools — the
          path lives off-chain at 30–40fps.
        </p>

        {showGuest && (
          <label style={styles.label}>
            Guest wanderer ID
            <input
              value={playerId}
              onChange={(e) => onPlayerId(e.target.value)}
              style={styles.input}
              maxLength={48}
            />
          </label>
        )}

        <div style={styles.ctaRow}>
          <button
            type="button"
            className="dl-cta"
            disabled={busy}
            style={styles.primary}
            onClick={() => onStart("easy")}
          >
            Easy Drift
          </button>
          <button
            type="button"
            className="dl-cta"
            disabled={busy}
            style={styles.secondary}
            onClick={() => onStart("standard")}
          >
            Standard
          </button>
          <button
            type="button"
            className="dl-cta"
            disabled={busy}
            style={styles.danger}
            onClick={() => onStart("hard")}
          >
            Hard
          </button>
        </div>
        {error && <p style={styles.error}>{error}</p>}
        <p style={styles.note}>Demo mode — revive fees simulated until on-chain pay_revive ships.</p>
      </div>
      <div className="dl-orb" style={styles.orb} aria-hidden />
    </main>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    display: "grid",
    placeItems: "center",
    padding: 24,
    position: "relative",
    overflow: "hidden",
  },
  hero: { maxWidth: 640, width: "100%", zIndex: 1 },
  brand: {
    margin: 0,
    fontFamily: '"Space Grotesk", sans-serif',
    fontSize: "clamp(3rem, 10vw, 5.5rem)",
    fontWeight: 700,
    letterSpacing: "-0.05em",
    lineHeight: 0.95,
    color: "#1b1f3b",
    textShadow: "4px 4px 0 #ff6b4a, 8px 8px 0 #ffd166",
    willChange: "transform, opacity",
  },
  headline: {
    margin: "18px 0 10px",
    fontSize: "clamp(1.4rem, 3vw, 2rem)",
    fontWeight: 800,
    willChange: "transform, opacity",
  },
  lead: {
    margin: "0 0 16px",
    fontSize: "1.1rem",
    lineHeight: 1.5,
    color: "#3d4466",
    maxWidth: 520,
  },
  label: {
    display: "flex",
    flexDirection: "column",
    gap: 8,
    fontWeight: 700,
    marginBottom: 18,
  },
  input: {
    border: "3px solid #1b1f3b",
    borderRadius: 14,
    padding: "12px 14px",
    fontSize: 16,
    fontFamily: "inherit",
    background: "#fff1d6",
  },
  ctaRow: { display: "flex", flexWrap: "wrap", gap: 10 },
  primary: {
    background: "#ff6b4a",
    color: "#fff",
    border: "3px solid #1b1f3b",
    borderRadius: 999,
    padding: "12px 22px",
    fontWeight: 800,
    boxShadow: "0 6px 0 #1b1f3b",
    willChange: "transform, opacity",
  },
  secondary: {
    background: "#2ec4b6",
    color: "#1b1f3b",
    border: "3px solid #1b1f3b",
    borderRadius: 999,
    padding: "12px 22px",
    fontWeight: 800,
    boxShadow: "0 6px 0 #1b1f3b",
    willChange: "transform, opacity",
  },
  danger: {
    background: "#ff5c8a",
    color: "#fff",
    border: "3px solid #1b1f3b",
    borderRadius: 999,
    padding: "12px 22px",
    fontWeight: 800,
    boxShadow: "0 6px 0 #1b1f3b",
    willChange: "transform, opacity",
  },
  note: { marginTop: 18, color: "#3d4466", fontSize: 14 },
  error: { color: "#ff4d6d", fontWeight: 700 },
  orb: {
    position: "absolute",
    width: 420,
    height: 420,
    borderRadius: "50%",
    right: "-6%",
    bottom: "-10%",
    background: "radial-gradient(circle at 30% 30%, #ffe08a, #ff6b4a 55%, #2ec4b6 100%)",
    filter: "blur(2px)",
    opacity: 0.85,
    willChange: "transform",
  },
};
