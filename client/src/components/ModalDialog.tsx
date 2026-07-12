"use client";

import type { ReactNode } from "react";

type Props = {
  open: boolean;
  title: ReactNode;
  onClose: () => void;
  children: ReactNode;
  wide?: boolean;
};

/** Shared DOM dialog shell — no backdrop-filter (PRD UI rules). */
export function ModalDialog({ open, title, onClose, children, wide = false }: Props) {
  if (!open) return null;

  return (
    <div
      style={styles.backdrop}
      role="presentation"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{ ...styles.panel, maxWidth: wide ? 560 : 420 }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="dl-dialog-title"
      >
        <div style={styles.head}>
          <h2 id="dl-dialog-title" style={styles.title}>
            {title}
          </h2>
          <button type="button" style={styles.close} onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>
        <div style={styles.body}>{children}</div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  backdrop: {
    position: "fixed",
    inset: 0,
    background: "rgba(27, 31, 59, 0.5)",
    display: "grid",
    placeItems: "center",
    zIndex: 60,
    padding: 16,
    pointerEvents: "auto",
  },
  panel: {
    width: "100%",
    maxHeight: "85vh",
    overflow: "auto",
    background: "#fff1d6",
    border: "3px solid #1b1f3b",
    borderRadius: 20,
    padding: 18,
    boxShadow: "0 12px 0 #1b1f3b",
  },
  head: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
    marginBottom: 12,
  },
  title: {
    margin: 0,
    fontFamily: '"Space Grotesk", sans-serif',
    fontSize: 22,
    color: "#1b1f3b",
  },
  close: {
    border: "2px solid #1b1f3b",
    background: "#ffd166",
    borderRadius: 10,
    width: 36,
    height: 36,
    fontWeight: 800,
    cursor: "pointer",
  },
  body: { color: "#1b1f3b" },
};
