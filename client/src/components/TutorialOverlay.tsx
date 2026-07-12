"use client";

import { useState } from "react";
import { ModalDialog } from "./ModalDialog";

const TUTORIAL_KEY = "dl_tutorial_seen";

const slides = [
  {
    title: "Welcome to Driftlands",
    text: "You are a Wanderer exploring the coral dunes of a shattered archipelago. Survive 14 zones, collect artifacts, and build your legend.",
    glyph: null,
  },
  {
    title: "Movement",
    text: "Use WASD or arrow keys to walk through the 3D world. Walk near glowing nodes to interact with hazards, caches, and NPCs.",
    glyph: null,
  },
  {
    title: "Interaction",
    text: "Press E to interact when near a node. Each zone has a hazard — your survival chance depends on your level score and equipped artifacts.",
    glyph: null,
  },
  {
    title: "Artifacts & Loot",
    text: "Survive hazards to find artifacts that boost your survival odds. Some artifacts grant revive discounts or unlock special abilities.",
    glyph: null,
  },
  {
    title: "Death & Revival",
    text: "If you fall, you can revive for a $DRIFT fee. But each revive costs more. Run out of revives and your journey ends in permadeath.",
    glyph: null,
  },
  {
    title: "Words of the NPCs",
    text: "The inhabitants of the dunes have stories to tell. Talk to them by approaching and pressing E. Their dialogue may reveal secrets or grant resources.",
    glyph: null,
  },
  {
    title: "Multiplayer",
    text: "Create or join a room to journey together. The host picks the difficulty — all players face the same seed. Last one standing wins the leaderboard.",
    glyph: null,
  },
  {
    title: "Progression",
    text: "Every journey earns XP toward your Wayfarer rank. Daily logins build your streak for bonus rewards. Check your profile with P.",
    glyph: null,
  },
  {
    title: "Ready?",
    text: "Press 1 for Easy, 2 for Standard, 3 for Hard. Good luck, Wanderer.",
    glyph: null,
  },
];

export function TutorialOverlay() {
  const [step, setStep] = useState(0);
  const [open, setOpen] = useState(() => {
    if (typeof window === "undefined") return false;
    return !localStorage.getItem(TUTORIAL_KEY);
  });

  if (!open) return null;

  const slide = slides[step];
  const isLast = step === slides.length - 1;

  const next = () => {
    if (isLast) {
      localStorage.setItem(TUTORIAL_KEY, "1");
      setOpen(false);
    } else {
      setStep((s) => s + 1);
    }
  };

  const skip = () => {
    localStorage.setItem(TUTORIAL_KEY, "1");
    setOpen(false);
  };

  return (
    <ModalDialog open={open} onClose={skip} title={slide.title} wide>
      <div style={styles.body}>
        <p style={styles.text}>{slide.text}</p>
        <div style={styles.dots}>
          {slides.map((_, i) => (
            <span
              key={i}
              style={{
                ...styles.dot,
                background: i === step ? "#5cdbf0" : "rgba(255,255,255,0.2)",
              }}
            />
          ))}
        </div>
        <div style={styles.actions}>
          <button onClick={skip} style={styles.skipBtn}>Skip</button>
          <button onClick={next} style={styles.nextBtn}>
            {isLast ? "Begin" : "Next →"}
          </button>
        </div>
      </div>
    </ModalDialog>
  );
}

const styles: Record<string, React.CSSProperties> = {
  body: { display: "flex", flexDirection: "column", alignItems: "center", gap: 16 },
  text: { fontSize: 16, lineHeight: 1.6, color: "#c8d4e8", textAlign: "center", margin: 0 },
  dots: { display: "flex", gap: 8 },
  dot: { width: 8, height: 8, borderRadius: "50%", display: "inline-block" },
  actions: { display: "flex", gap: 12, marginTop: 8 },
  skipBtn: {
    background: "transparent",
    border: "1px solid rgba(255,255,255,0.2)",
    color: "rgba(255,255,255,0.5)",
    borderRadius: 8,
    padding: "10px 20px",
    cursor: "pointer",
    fontSize: 14,
  },
  nextBtn: {
    background: "#5cdbf0",
    border: "none",
    color: "#0b1220",
    borderRadius: 8,
    padding: "10px 24px",
    cursor: "pointer",
    fontSize: 14,
    fontWeight: 700,
  },
};