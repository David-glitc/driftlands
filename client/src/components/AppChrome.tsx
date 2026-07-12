"use client";

import { GlyphProfile, GlyphSettings } from "@/components/Glyphs";

type Props = {
  onOpenSettings: () => void;
  onOpenHotkeys: () => void;
  onOpenProfile?: () => void;
};

/** Top-left chrome for profile, settings + keyboard manual. */
export function AppChrome({ onOpenSettings, onOpenHotkeys, onOpenProfile }: Props) {
  return (
    <div style={styles.wrap}>
      {onOpenProfile && (
        <button type="button" style={styles.btn} onClick={onOpenProfile} title="Profile">
          <GlyphProfile size={16} />
          <span>Profile</span>
        </button>
      )}
      <button type="button" style={styles.btn} onClick={onOpenSettings} title="Settings (S)">
        <GlyphSettings size={16} />
        <span>Settings</span>
      </button>
      <button type="button" style={styles.btn} onClick={onOpenHotkeys} title="Keyboard manual (?)">
        <span>?</span>
        <span>Keys</span>
      </button>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  wrap: {
    position: "fixed",
    top: 18,
    left: 18,
    zIndex: 50,
    display: "flex",
    gap: 8,
    pointerEvents: "auto",
  },
  btn: {
    border: "2px solid rgba(255,255,255,0.25)",
    background: "rgba(20,24,40,0.8)",
    color: "#fff",
    borderRadius: 999,
    padding: "6px 12px",
    fontWeight: 700,
    fontSize: 11,
    display: "flex",
    alignItems: "center",
    gap: 5,
    cursor: "pointer",
  },
};
