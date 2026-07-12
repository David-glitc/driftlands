"use client";

import { ModalDialog } from "@/components/ModalDialog";
import {
  type DriftSettings,
  type GraphicsQuality,
  saveSettings,
} from "@/lib/settings";

type Props = {
  open: boolean;
  onClose: () => void;
  settings: DriftSettings;
  onSettings: (next: DriftSettings) => void;
};

export function SettingsPanel({ open, onClose, settings, onSettings }: Props) {
  const patch = (partial: Partial<DriftSettings>) => {
    const next = { ...settings, ...partial };
    saveSettings(next);
    onSettings(next);
  };

  return (
    <ModalDialog open={open} title="Settings" onClose={onClose}>
      <p style={styles.lead}>Tune the dunes for your machine. Choices stick in this browser.</p>

      <label style={styles.row}>
        <span>Graphics</span>
        <select
          value={settings.graphicsQuality}
          onChange={(e) => patch({ graphicsQuality: e.target.value as GraphicsQuality })}
          style={styles.select}
        >
          <option value="low">Low — lighter draw</option>
          <option value="medium">Medium</option>
          <option value="high">High — full dunes</option>
        </select>
      </label>

      <Toggle
        label="Reduced motion"
        checked={settings.reducedMotion}
        onChange={(v) => patch({ reducedMotion: v })}
      />
      <Toggle
        label="Sound (demo cue)"
        checked={settings.soundEnabled}
        onChange={(v) => patch({ soundEnabled: v })}
      />
      <Toggle
        label="Camera sway"
        checked={settings.cameraShake}
        onChange={(v) => patch({ cameraShake: v })}
      />
      <Toggle
        label="Show FPS tip in log"
        checked={settings.showFpsHint}
        onChange={(v) => patch({ showFpsHint: v })}
      />
      <Toggle
        label="Show hotkey hints"
        checked={settings.showHotkeyHints}
        onChange={(v) => patch({ showHotkeyHints: v })}
      />

      <p style={styles.hint}>Press ? anytime for the keyboard manual · Esc closes panels.</p>
    </ModalDialog>
  );
}

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label style={styles.toggle}>
      <span>{label}</span>
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
    </label>
  );
}

const styles: Record<string, React.CSSProperties> = {
  lead: { margin: "0 0 14px", color: "#3d4466", fontWeight: 600, fontSize: 13 },
  row: {
    display: "flex",
    flexDirection: "column",
    gap: 6,
    fontWeight: 700,
    fontSize: 13,
    marginBottom: 12,
  },
  select: {
    border: "2px solid #1b1f3b",
    borderRadius: 10,
    padding: "10px 12px",
    fontFamily: "inherit",
    background: "#fff",
  },
  toggle: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
    fontWeight: 700,
    fontSize: 13,
    padding: "10px 0",
    borderTop: "1px solid rgba(27,31,59,0.12)",
  },
  hint: { margin: "14px 0 0", fontSize: 12, color: "#3d4466", fontWeight: 600 },
};
