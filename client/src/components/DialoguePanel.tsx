"use client";

import { useState } from "react";
import type { DialogueTree, DialogueLine } from "@driftlands/shared";
import { CHARACTERS } from "@driftlands/shared";

type Props = {
  dialogue: DialogueTree;
  onChoice: (lineId: string, choiceIndex: number) => void;
  onClose: () => void;
};

export function DialoguePanel({ dialogue, onChoice, onClose }: Props) {
  const char = CHARACTERS[dialogue.character];
  const [currentLineId, setCurrentLineId] = useState(dialogue.start);
  const [ended, setEnded] = useState(false);

  const currentLine: DialogueLine | undefined = dialogue.lines[currentLineId];

  const handleChoice = (idx: number) => {
    if (!currentLine?.choices?.[idx]) return;
    const choice = currentLine.choices[idx]!;
    if (choice.next === "end") {
      // Resolve effects via parent
      onChoice(currentLineId, idx);
      setEnded(true);
      setTimeout(onClose, 2200);
      return;
    }
    onChoice(currentLineId, idx);
    setCurrentLineId(choice.next);
  };

  const handleContinue = () => {
    if (!currentLine?.choices) {
      onChoice(currentLineId, -1);
      setEnded(true);
      setTimeout(onClose, 2200);
    }
  };

  if (!char || !currentLine) return null;

  return (
    <div style={styles.backdrop} onClick={(e) => { if (e.target === e.currentTarget && ended) onClose(); }}>
      <div style={styles.panel}>
        {/* Character header */}
        <div style={styles.header}>
          <div style={{ ...styles.avatar, background: char.id === "archivist" ? "#5CDBF0" : char.id === "wren" ? "#4ade80" : char.id === "solara" ? "#ff6b4a" : char.id === "keeper" ? "#c084fc" : char.id === "echo" ? "#fbbf24" : "#ffd166" }}>
            {char.avatar}
          </div>
          <div style={styles.charInfo}>
            <span style={styles.charName}>{char.name}</span>
            <span style={styles.charTitle}>{char.title}</span>
          </div>
        </div>

        {/* Dialogue text */}
        <div style={styles.dialogue}>
          <p style={styles.text}>{currentLine.text}</p>
        </div>

        {/* Choices or continue */}
        {ended ? (
          <p style={styles.ended}>End of conversation</p>
        ) : currentLine.choices ? (
          <div style={styles.choices}>
            {currentLine.choices.map((c, i) => (
              <button key={i} type="button" style={styles.choice} onClick={() => handleChoice(i)}>
                {c.text}
              </button>
            ))}
          </div>
        ) : (
          <button type="button" style={styles.continueBtn} onClick={handleContinue}>
            Continue
          </button>
        )}
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  backdrop: {
    position: "fixed",
    inset: 0,
    zIndex: 70,
    background: "rgba(11,18,32,0.85)",
    display: "flex",
    alignItems: "flex-end",
    justifyContent: "center",
    padding: "0 20px 80px",
  },
  panel: {
    width: "100%",
    maxWidth: 560,
    background: "rgba(20,24,40,0.95)",
    border: "1px solid rgba(255,255,255,0.15)",
    borderRadius: 20,
    padding: 20,
    color: "#fff",
  },
  header: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    marginBottom: 14,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 800,
    fontSize: 18,
    color: "#0b1220",
  },
  charInfo: {
    display: "flex",
    flexDirection: "column" as const,
    gap: 2,
  },
  charName: { fontWeight: 800, fontSize: 16 },
  charTitle: { fontSize: 11, color: "rgba(255,255,255,0.5)", fontWeight: 600 },
  dialogue: { marginBottom: 12 },
  text: {
    margin: 0,
    fontSize: 14,
    lineHeight: 1.6,
    color: "rgba(255,255,255,0.9)",
  },
  effects: {
    display: "flex",
    gap: 8,
    flexWrap: "wrap" as const,
    marginBottom: 12,
  },
  effect: {
    background: "rgba(255,209,102,0.15)",
    color: "#ffd166",
    borderRadius: 8,
    padding: "3px 10px",
    fontSize: 11,
    fontWeight: 700,
  },
  choices: {
    display: "flex",
    flexDirection: "column" as const,
    gap: 6,
  },
  choice: {
    textAlign: "left" as const,
    background: "rgba(255,255,255,0.08)",
    border: "1px solid rgba(255,255,255,0.15)",
    borderRadius: 12,
    padding: "10px 16px",
    color: "#fff",
    fontWeight: 600,
    fontSize: 13,
    cursor: "pointer",
    fontFamily: "inherit",
  },
  continueBtn: {
    width: "100%",
    background: "rgba(255,209,102,0.2)",
    border: "1px solid rgba(255,209,102,0.3)",
    borderRadius: 12,
    padding: "10px",
    color: "#ffd166",
    fontWeight: 700,
    fontSize: 13,
    cursor: "pointer",
    fontFamily: "inherit",
    marginTop: 4,
  },
  ended: {
    textAlign: "center" as const,
    fontSize: 12,
    color: "rgba(255,255,255,0.3)",
    fontStyle: "italic",
    margin: "8px 0 0",
  },
};
