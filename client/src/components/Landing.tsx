"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import type { LevelStateView } from "@driftlands/shared";
import { DemoStakePanel } from "@/components/DemoStakePanel";
import { RoomLobby } from "@/components/RoomLobby";
import { LobbyScene } from "@/components/LobbyScene";
import { api } from "@/lib/api";
import { GlyphLeaderboard } from "@/components/Glyphs";
import type { GameRoom } from "@driftlands/shared";

gsap.registerPlugin(useGSAP);

const WalletBar = dynamic(() => import("./WalletBar").then((m) => m.WalletBar), { ssr: false });

type LeaderboardRow = {
  playerId: string;
  displayName?: string;
  reputation: number;
  journeysWon: number;
};

type Props = {
  playerId: string;
  onPlayerId: (id: string) => void;
  level: LevelStateView | null;
  onLevel: (level: LevelStateView) => void;
  onStart: (difficulty: "easy" | "standard" | "hard") => void;
  busy: boolean;
  error: string | null;
  reducedMotion?: boolean;
  graphicsQuality?: "low" | "medium" | "high";
  onJoinRoom?: (roomId: string) => void;
  onCreateRoom?: (room: GameRoom) => void;
};

export function Landing({
  playerId,
  onPlayerId,
  onStart,
  busy,
  error,
  level,
  onLevel,
  reducedMotion = false,
  graphicsQuality = "high",
  onJoinRoom,
  onCreateRoom,
}: Props) {
  const rootRef = useRef<HTMLElement>(null);
  const [showGuest, setShowGuest] = useState(true);
  const [lb, setLb] = useState<LeaderboardRow[]>([]);

  useEffect(() => {
    api.leaderboard().then((d) => setLb(d.entries.slice(0, 5))).catch(() => {});
    const interval = setInterval(() => {
      api.leaderboard().then((d) => setLb(d.entries.slice(0, 5))).catch(() => {});
    }, 30_000);
    return () => clearInterval(interval);
  }, []);

  useGSAP(
    () => {
      gsap.set([".dl-logo", ".dl-brand", ".dl-headline", ".dl-lead", ".dl-cta", ".dl-hero-art", ".dl-lb"], {
        autoAlpha: 1,
        y: 0,
        scale: 1,
        clearProps: "visibility",
      });
      if (reducedMotion) return;
      const tl = gsap.timeline({ defaults: { ease: "power3.out", duration: 0.75 } });
      tl.fromTo(".dl-logo", { y: 36, scale: 0.92 }, { y: 0, scale: 1 })
        .fromTo(".dl-brand", { y: 22 }, { y: 0 }, "-=0.5")
        .fromTo(".dl-headline", { y: 16 }, { y: 0 }, "-=0.45")
        .fromTo(".dl-lead", { y: 12 }, { y: 0 }, "-=0.4")
        .fromTo(".dl-cta", { y: 10 }, { y: 0, stagger: 0.08 }, "-=0.35")
        .fromTo(".dl-lb", { y: 10, opacity: 0 }, { y: 0, opacity: 1 }, "-=0.2");
      gsap.to(".dl-hero-art", {
        y: -14,
        duration: 3.4,
        ease: "sine.inOut",
        yoyo: true,
        repeat: -1,
      });
    },
    { scope: rootRef, dependencies: [reducedMotion] },
  );

  return (
    <main ref={rootRef} style={styles.page}>
      {/* 3D Lobby background */}
      <div style={styles.lobbyBg}>
        <LobbyScene graphicsQuality={graphicsQuality} reducedMotion={reducedMotion} />
      </div>

      <WalletBar
        playerId={playerId}
        onPlayerId={(id) => {
          onPlayerId(id);
          if (id.length > 32) setShowGuest(false);
        }}
      />

      <section className="dl-landing-hero" style={styles.hero}>
        <div style={styles.heroCopy}>
          <Image
            className="dl-logo"
            src="/logo.png"
            alt="Driftlands"
            width={128}
            height={128}
            priority
            style={styles.logo}
          />
          <p className="dl-brand" style={styles.brand}>
            DRIFTLANDS
          </p>
          <h1 className="dl-headline" style={styles.headline}>
            Stake. Survive. Drift.
          </h1>
          <p className="dl-lead" style={styles.lead}>
            Fragments of old certainty. Walk the coral dunes — the chain settles the stake, the
            path lives off-chain.
          </p>
          <div style={styles.ctaRow}>
            <button type="button" className="dl-cta" disabled={busy} style={styles.easy} onClick={() => onStart("easy")}>
              Easy Drift
            </button>
            <button type="button" className="dl-cta" disabled={busy} style={styles.standard} onClick={() => onStart("standard")}>
              Standard
            </button>
            <button type="button" className="dl-cta" disabled={busy} style={styles.hard} onClick={() => onStart("hard")}>
              Hard
            </button>
          </div>
          {error && <p style={styles.error}>{error}</p>}
        </div>

        {/* Leaderboard widget */}
        <div className="dl-lb" style={styles.lbWrap}>
          <div style={styles.lbTitle}>
            <GlyphLeaderboard size={16} />
            <span>Top Wanderers</span>
          </div>
          {lb.map((entry, i) => (
            <div key={entry.playerId} style={styles.lbRow}>
              <span style={styles.lbPos}>#{i + 1}</span>
              <span style={styles.lbName}>{entry.displayName ?? entry.playerId.slice(0, 12)}</span>
              <span style={styles.lbRep}>{entry.reputation}</span>
            </div>
          ))}
          {lb.length === 0 && <p style={styles.lbEmpty}>No journeys yet — be the first.</p>}
        </div>
      </section>

      <RoomLobby playerId={playerId} onJoinRoom={onJoinRoom ?? (() => {})} onCreateRoom={onCreateRoom ?? (() => {})} />

      <section style={styles.setup} aria-label="Prepare your run">
        {showGuest && (
          <label style={styles.label}>
            Guest name
            <input
              value={playerId}
              onChange={(e) => onPlayerId(e.target.value)}
              style={styles.input}
              maxLength={48}
              placeholder="Wanderer"
            />
          </label>
        )}
        <DemoStakePanel playerId={playerId} level={level} onLevel={onLevel} />
        <p style={styles.note}>
          Press <kbd style={styles.kbd}>?</kbd> for keys · <kbd style={styles.kbd}>S</kbd> for settings · demo stake sets Level Score.
        </p>
      </section>
    </main>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    position: "relative",
    overflowX: "hidden",
    padding: "0 0 48px",
    background: "#0b1220",
  },
  lobbyBg: {
    position: "fixed",
    inset: 0,
    zIndex: 0,
  },
  hero: {
    position: "relative",
    zIndex: 1,
    minHeight: "100vh",
    display: "grid",
    gridTemplateColumns: "minmax(0, 1fr) minmax(280px, 340px)",
    alignItems: "center",
    gap: 24,
    padding: "96px 28px 48px",
    maxWidth: 1180,
    margin: "0 auto",
  },
  heroCopy: { maxWidth: 560 },
  logo: {
    borderRadius: 28,
    border: "3px solid rgba(255,255,255,0.3)",
    boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
    background: "rgba(255,241,214,0.15)",
    backdropFilter: "blur(8px)",
  },
  brand: {
    margin: "18px 0 0",
    fontFamily: '"Space Grotesk", sans-serif',
    fontSize: "clamp(3.2rem, 9vw, 5.2rem)",
    fontWeight: 700,
    letterSpacing: "-0.05em",
    lineHeight: 0.92,
    color: "#fff",
    textShadow: "4px 4px 0 rgba(255,107,74,0.5), 8px 8px 0 rgba(255,209,102,0.4)",
  },
  headline: {
    margin: "16px 0 10px",
    fontSize: "clamp(1.35rem, 2.8vw, 2rem)",
    fontWeight: 800,
    color: "rgba(255,255,255,0.95)",
  },
  lead: {
    margin: "0 0 22px",
    fontSize: "1.12rem",
    lineHeight: 1.5,
    color: "rgba(255,255,255,0.7)",
    maxWidth: 460,
    fontWeight: 600,
  },
  ctaRow: { display: "flex", flexWrap: "wrap", gap: 10 },
  easy: {
    background: "#4ade80",
    color: "#0b1220",
    border: "3px solid rgba(255,255,255,0.2)",
    borderRadius: 999,
    padding: "14px 28px",
    fontWeight: 800,
    fontSize: 15,
    cursor: "pointer",
    boxShadow: "0 6px 0 rgba(0,0,0,0.3)",
  },
  standard: {
    background: "#fbbf24",
    color: "#0b1220",
    border: "3px solid rgba(255,255,255,0.2)",
    borderRadius: 999,
    padding: "14px 28px",
    fontWeight: 800,
    fontSize: 15,
    cursor: "pointer",
    boxShadow: "0 6px 0 rgba(0,0,0,0.3)",
  },
  hard: {
    background: "#ef476f",
    color: "#fff",
    border: "3px solid rgba(255,255,255,0.2)",
    borderRadius: 999,
    padding: "14px 28px",
    fontWeight: 800,
    fontSize: 15,
    cursor: "pointer",
    boxShadow: "0 6px 0 rgba(0,0,0,0.3)",
  },
  error: { color: "#ff4d6d", fontWeight: 700, marginTop: 12 },
  lbWrap: {
    background: "rgba(20,24,40,0.75)",
    border: "1px solid rgba(255,255,255,0.12)",
    borderRadius: 18,
    padding: 16,
    color: "#fff",
  },
  lbTitle: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    fontWeight: 800,
    fontSize: 14,
    marginBottom: 10,
    color: "#ffd166",
  },
  lbRow: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    padding: "5px 0",
    fontSize: 13,
  },
  lbPos: { fontWeight: 800, color: "#ffd166", width: 26 },
  lbName: { flex: 1, fontWeight: 600 },
  lbRep: { fontSize: 12, color: "rgba(255,255,255,0.5)" },
  lbEmpty: { fontSize: 12, color: "rgba(255,255,255,0.4)", fontStyle: "italic" },
  setup: {
    position: "relative",
    zIndex: 1,
    maxWidth: 640,
    margin: "0 auto",
    padding: "0 24px",
  },
  label: {
    display: "flex",
    flexDirection: "column",
    gap: 8,
    fontWeight: 700,
    marginBottom: 14,
    color: "rgba(255,255,255,0.9)",
  },
  input: {
    border: "2px solid rgba(255,255,255,0.2)",
    borderRadius: 14,
    padding: "12px 14px",
    fontSize: 16,
    fontFamily: "inherit",
    background: "rgba(255,255,255,0.1)",
    color: "#fff",
  },
  note: { marginTop: 14, color: "rgba(255,255,255,0.5)", fontSize: 13, fontWeight: 600 },
  kbd: {
    fontFamily: '"Space Grotesk", monospace',
    background: "rgba(255,255,255,0.15)",
    color: "#ffd166",
    borderRadius: 6,
    padding: "2px 6px",
    fontSize: 11,
  },
};
