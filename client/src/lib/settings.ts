"use client";

export type GraphicsQuality = "low" | "medium" | "high";

export type DriftSettings = {
  graphicsQuality: GraphicsQuality;
  reducedMotion: boolean;
  soundEnabled: boolean;
  showFpsHint: boolean;
  showHotkeyHints: boolean;
  cameraShake: boolean;
};

export const DEFAULT_SETTINGS: DriftSettings = {
  graphicsQuality: "high",
  reducedMotion: false,
  soundEnabled: true,
  showFpsHint: false,
  showHotkeyHints: true,
  cameraShake: true,
};

const STORAGE_KEY = "dl_settings_v1";

export function loadSettings(): DriftSettings {
  if (typeof window === "undefined") return { ...DEFAULT_SETTINGS };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_SETTINGS };
    return { ...DEFAULT_SETTINGS, ...(JSON.parse(raw) as Partial<DriftSettings>) };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

export function saveSettings(next: DriftSettings): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  window.dispatchEvent(new CustomEvent("dl-settings", { detail: next }));
}

export const HOTKEY_MANUAL: Array<{ keys: string; action: string; context: string }> = [
  { keys: "Space / Enter", action: "Advance along the path", context: "Journey" },
  { keys: "I", action: "Open / close fragments inventory", context: "Journey" },
  { keys: "Esc", action: "Close panels · open Settings", context: "Global" },
  { keys: "?", action: "Open this keyboard manual", context: "Global" },
  { keys: "S", action: "Open Settings", context: "Global" },
  { keys: "L", action: "Leave journey (return to landing)", context: "Journey" },
  { keys: "1 / 2 / 3", action: "Start Easy / Standard / Hard", context: "Landing" },
];
