"use client";

import { ModalDialog } from "@/components/ModalDialog";
import { HOTKEY_MANUAL } from "@/lib/settings";

type Props = {
  open: boolean;
  onClose: () => void;
};

export function HotkeysManual({ open, onClose }: Props) {
  return (
    <ModalDialog open={open} title="Keyboard manual" onClose={onClose} wide>
      <p style={styles.lead}>
        Walk the Drift with keys when you can — buttons still work on every screen.
      </p>
      <div style={styles.table}>
        <div style={styles.th}>
          <span>Keys</span>
          <span>Action</span>
          <span>Where</span>
        </div>
        {HOTKEY_MANUAL.map((row) => (
          <div key={row.keys + row.action} style={styles.tr}>
            <kbd style={styles.kbd}>{row.keys}</kbd>
            <span>{row.action}</span>
            <span style={styles.ctx}>{row.context}</span>
          </div>
        ))}
      </div>
    </ModalDialog>
  );
}

const styles: Record<string, React.CSSProperties> = {
  lead: { margin: "0 0 14px", color: "#3d4466", fontWeight: 600, fontSize: 13 },
  table: { display: "flex", flexDirection: "column", gap: 8 },
  th: {
    display: "grid",
    gridTemplateColumns: "1.1fr 1.4fr 0.7fr",
    gap: 8,
    fontSize: 11,
    fontWeight: 800,
    letterSpacing: "0.06em",
    textTransform: "uppercase",
    color: "#3d4466",
    opacity: 0.8,
  },
  tr: {
    display: "grid",
    gridTemplateColumns: "1.1fr 1.4fr 0.7fr",
    gap: 8,
    alignItems: "center",
    padding: "10px 12px",
    background: "rgba(255,255,255,0.55)",
    border: "2px solid #1b1f3b",
    borderRadius: 12,
    fontSize: 13,
    fontWeight: 600,
  },
  kbd: {
    fontFamily: '"Space Grotesk", monospace',
    fontWeight: 700,
    fontSize: 12,
    background: "#1b1f3b",
    color: "#ffd166",
    borderRadius: 8,
    padding: "6px 8px",
    display: "inline-block",
  },
  ctx: { fontSize: 11, fontWeight: 700, color: "#3d4466", textTransform: "uppercase" },
};
