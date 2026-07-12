"use client";

/* ── Pixel-style SVG glyphs for all Driftlands concepts ── */

export type GlyphSize = 12 | 16 | 20 | 24 | 32;

const sizeMap: Record<GlyphSize, string> = { 12: "12", 16: "16", 20: "20", 24: "24", 32: "32" };

function G({ size, children }: { size: GlyphSize; children: React.ReactNode }) {
  const s = sizeMap[size];
  return (
    <svg
      width={s}
      height={s}
      viewBox="0 0 24 24"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: "block", flexShrink: 0 }}
    >
      {children}
    </svg>
  );
}

/* ── Artifact categories ── */

export function GlyphArmor({ size = 20 }: { size?: GlyphSize }) {
  return (
    <G size={size}>
      <path d="M12 2l-8 4v4c0 5.5 3.8 10.7 8 12 4.2-1.3 8-6.5 8-12V6l-8-4zm0 2.2l5.5 2.8v3c0 4.3-2.8 8.5-5.5 9.8-2.7-1.3-5.5-5.5-5.5-9.8V7l5.5-2.8z" />
      <rect x="9" y="8" width="6" height="2" rx="1" />
      <path d="M10 10v3h4v-3" />
    </G>
  );
}

export function GlyphFood({ size = 20 }: { size?: GlyphSize }) {
  return (
    <G size={size}>
      <path d="M17 2c-.5 0-1 .2-1.4.6C14.2 4 13 6 13 8.5c0 1 .2 2 .6 3L12 18c-.5 1.5.5 3 2 3h2c1.5 0 2.5-1.5 2-3l-1.6-6.5c.4-1 .6-2 .6-3C17 6 15.8 4 14.4 2.6 14 2.2 13.5 2 13 2z" />
      <circle cx="13" cy="9" r="1.5" />
    </G>
  );
}

export function GlyphTool({ size = 20 }: { size?: GlyphSize }) {
  return (
    <G size={size}>
      <path d="M14.5 2.5l-4 4L9 5 6.5 7.5 5 6l-3 3 1.5 1.5L2 12l1.5 1.5L5 12l1.5 1.5L8 12l-1.5-1.5 2.5-2.5 1.5 1.5 3-3 1 1 3-3-3-3z" />
      <rect x="15" y="15" width="6" height="4" rx="1" transform="rotate(-45 18 17)" />
    </G>
  );
}

export function GlyphCharm({ size = 20 }: { size?: GlyphSize }) {
  return (
    <G size={size}>
      <path d="M12 2l3 6 6.5 1-4.7 4.6 1.1 6.4L12 17l-5.9 3 1.1-6.4L2.5 9l6.5-1L12 2z" />
    </G>
  );
}

/* ── Hazard kinds ── */

export function GlyphStorm({ size = 20 }: { size?: GlyphSize }) {
  return (
    <G size={size}>
      <path d="M19 16l-2 1 2 1-2 1h-3l-1-3 2-2 1 2 1-1-2-2 2-1 3 3-1 1zm-8-1H8v2H6v-2H3l-1-1 4-4v-2h2v2l4 4-1 1zm7-7l-5-5H7L2 8h5v2h2V8h4l2 2 3-2z" />
    </G>
  );
}

export function GlyphAmbush({ size = 20 }: { size?: GlyphSize }) {
  return (
    <G size={size}>
      <path d="M12 2L9 7H3l5 4-2 7 6-4 6 4-2-7 5-4h-6L12 2z" />
      <circle cx="12" cy="12" r="3" />
    </G>
  );
}

export function GlyphFire({ size = 20 }: { size?: GlyphSize }) {
  return (
    <G size={size}>
      <path d="M12 2c-1.5 2-3 4.5-3 7.5 0 2.5 1 4.5 2 5.5-1-.5-2-2-2-4 0-1.5.5-3 1-4-1 2.5 0 6 3 9-1-2-.5-5 1-6 1 2.5 2 5.5 1 9 3-3 2-6 0-9 2 1.5 3 4 3 6.5 0 2.5-1.5 4-3 5 1-1.5 2-4 2-7C15 6 14 3.5 12 2z" />
    </G>
  );
}

export function GlyphCache({ size = 20 }: { size?: GlyphSize }) {
  return (
    <G size={size}>
      <rect x="3" y="8" width="18" height="13" rx="2" />
      <path d="M3 10h18" stroke="currentColor" strokeWidth="2" fill="none" />
      <circle cx="12" cy="15" r="2" />
      <path d="M14 17l2 2M10 13l-2-2M14 13l2-2M10 17l-2 2" stroke="currentColor" strokeWidth="1.5" />
    </G>
  );
}

export function GlyphFork({ size = 20 }: { size?: GlyphSize }) {
  return (
    <G size={size}>
      <path d="M12 2v8M9 6l3-3 3 3M9 18l3-3 3 3M12 12v6" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" />
    </G>
  );
}

export function GlyphCheckpoint({ size = 20 }: { size?: GlyphSize }) {
  return (
    <G size={size}>
      <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="2" />
      <path d="M7 13l3 3 7-7" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </G>
  );
}

/* ── Stats ── */

export function GlyphPower({ size = 20 }: { size?: GlyphSize }) {
  return (
    <G size={size}>
      <path d="M13 2l-3 10h4l-2 10 8-12h-5l4-8-6 10z" />
    </G>
  );
}

export function GlyphVitality({ size = 20 }: { size?: GlyphSize }) {
  return (
    <G size={size}>
      <path d="M12 21s-7-5.5-7-10.5C5 7 7.5 4.5 12 3c4.5 1.5 7 4 7 7.5C19 15.5 12 21 12 21z" />
    </G>
  );
}

export function GlyphFocus({ size = 20 }: { size?: GlyphSize }) {
  return (
    <G size={size}>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 2v4m0 12v4M2 12h4m12 0h4" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" />
    </G>
  );
}

export function GlyphLuck({ size = 20 }: { size?: GlyphSize }) {
  return (
    <G size={size}>
      <path d="M12 2c-1 1.5-2 4-2 7 0 2.5.5 4.5 2 6M12 2c1 1.5 2 4 2 7 0 2.5-.5 4.5-2 6M7 7c1.5.5 4 1 7 1M7 10c1.5 1 4 2 7 2" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      <path d="M10 15l1 3h2l1-3" />
    </G>
  );
}

export function GlyphWeight({ size = 20 }: { size?: GlyphSize }) {
  return (
    <G size={size}>
      <rect x="5" y="2" width="14" height="4" rx="2" />
      <path d="M8 6v12a2 2 0 002 2h4a2 2 0 002-2V6" fill="none" stroke="currentColor" strokeWidth="2" />
      <line x1="10" y1="10" x2="14" y2="10" stroke="currentColor" strokeWidth="1.5" />
      <line x1="10" y1="14" x2="14" y2="14" stroke="currentColor" strokeWidth="1.5" />
    </G>
  );
}

/* ── Actions ── */

export function GlyphProfile({ size = 20 }: { size?: GlyphSize }) {
  return (
    <G size={size}>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" fill="none" stroke="currentColor" strokeWidth="2" />
    </G>
  );
}

export function GlyphAdvance({ size = 20 }: { size?: GlyphSize }) {
  return (
    <G size={size}>
      <path d="M5 12h12M12 7l5 5-5 5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </G>
  );
}

export function GlyphInventory({ size = 20 }: { size?: GlyphSize }) {
  return (
    <G size={size}>
      <path d="M4 6h16v14H4V6z" fill="none" stroke="currentColor" strokeWidth="2" />
      <path d="M4 10h16" stroke="currentColor" strokeWidth="2" />
      <path d="M9 2h6l2 4H7l2-4z" fill="none" stroke="currentColor" strokeWidth="2" />
    </G>
  );
}

export function GlyphSettings({ size = 20 }: { size?: GlyphSize }) {
  return (
    <G size={size}>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 2v3m0 14v3M2 12h3m14 0h3M4.9 4.9l2.1 2.1m9.9 9.9l2.1 2.1M4.9 19.1l2.1-2.1m9.9-9.9l2.1-2.1" stroke="currentColor" strokeWidth="2" fill="none" />
    </G>
  );
}

export function GlyphLeave({ size = 20 }: { size?: GlyphSize }) {
  return (
    <G size={size}>
      <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </G>
  );
}

export function GlyphClose({ size = 20 }: { size?: GlyphSize }) {
  return (
    <G size={size}>
      <path d="M6 6l12 12M18 6L6 18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </G>
  );
}

export function GlyphLeaderboard({ size = 20 }: { size?: GlyphSize }) {
  return (
    <G size={size}>
      <path d="M4 8h3v12H4V8zM10 3h3v17h-3V3zM16 6h3v14h-3V6z" />
      <path d="M5.5 5l2.5-3 2.5 3M11.5 2H7.5" fill="none" stroke="currentColor" strokeWidth="1.5" />
    </G>
  );
}

export function GlyphReputation({ size = 20 }: { size?: GlyphSize }) {
  return (
    <G size={size}>
      <path d="M12 1l3 6 6.5 1-4.7 4.6 1.1 6.4L12 16l-5.9 3.5 1.1-6.4L2.5 8l6.5-1L12 1z" />
    </G>
  );
}

/* ── Rank badges ── */

const rankColors: Record<string, string> = {
  common: "#9a9a9a",
  uncommon: "#4ade80",
  rare: "#60a5fa",
  epic: "#c084fc",
  legendary: "#fbbf24",
};

export function GlyphRank({ rank, size = 16 }: { rank: string; size?: GlyphSize }) {
  const color = rankColors[rank] ?? "#9a9a9a";
  return (
    <G size={size}>
      <circle cx="12" cy="12" r="10" fill={color} opacity={0.3} />
      <circle cx="12" cy="12" r="6" fill={color} opacity={0.6} />
      <circle cx="12" cy="12" r="3" fill={color} />
    </G>
  );
}

/* ── Category → glyph lookup ── */

export function categoryGlyph(category: string, size?: GlyphSize) {
  switch (category) {
    case "armor": return <GlyphArmor size={size} />;
    case "food": return <GlyphFood size={size} />;
    case "tool": return <GlyphTool size={size} />;
    case "charm": return <GlyphCharm size={size} />;
    default: return <GlyphCache size={size} />;
  }
}

export function hazardGlyph(kind: string, size?: GlyphSize) {
  switch (kind) {
    case "storm": return <GlyphStorm size={size} />;
    case "ambush": return <GlyphAmbush size={size} />;
    case "fire": return <GlyphFire size={size} />;
    case "cache": return <GlyphCache size={size} />;
    case "fork": return <GlyphFork size={size} />;
    case "checkpoint": return <GlyphCheckpoint size={size} />;
    default: return <GlyphCheckpoint size={size} />;
  }
}
