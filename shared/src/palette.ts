/** Bright, journey-forward palette — coral dunes, turquoise sky, sun accents. */
export const DRIFTLANDS_PALETTE = {
  coral: "#FF6B4A",
  coralDeep: "#E84A2F",
  turquoise: "#2EC4B6",
  turquoiseDeep: "#1A9E93",
  sun: "#FFD166",
  sunBright: "#FFE08A",
  sky: "#5CDBF0",
  skyDeep: "#3BB4E8",
  sand: "#FFF1D6",
  sandDeep: "#F0D5A8",
  magenta: "#FF5C8A",
  violetAccent: "#7B5CFF",
  ink: "#1B1F3B",
  inkMuted: "#3D4466",
  success: "#3DDC97",
  danger: "#FF4D6D",
  white: "#FFFFFF",
} as const;

export type PaletteColor = (typeof DRIFTLANDS_PALETTE)[keyof typeof DRIFTLANDS_PALETTE];
