"use client";

import { useState, useEffect } from "react";
import type { EquippedArtifact } from "@driftlands/shared";
import { getArtifactById, sumInventoryStats } from "@driftlands/shared";
import { ModalDialog } from "@/components/ModalDialog";
import { api } from "@/lib/api";
import {
  categoryGlyph,
  GlyphRank,
  GlyphPower,
  GlyphVitality,
  GlyphFocus,
  GlyphLuck,
  GlyphWeight,
  GlyphReputation,
  GlyphLeaderboard,
} from "@/components/Glyphs";

type Props = {
  open: boolean;
  onClose: () => void;
  playerId: string;
  inventory?: EquippedArtifact[];
  reputation?: number;
  journeysWon?: number;
};

type LeaderboardEntry = {
  playerId: string;
  displayName?: string;
  reputation: number;
  journeysWon: number;
};

export function ProfilePanel({ open, onClose, playerId, inventory = [], reputation = 0, journeysWon = 0 }: Props) {
  const [lb, setLb] = useState<LeaderboardEntry[]>([]);
  const [rank, setRank] = useState<number | null>(null);

  useEffect(() => {
    if (!open) return;
    api.leaderboard().then((data) => {
      setLb(data.entries);
      const idx = data.entries.findIndex((e) => e.playerId === playerId);
      setRank(idx >= 0 ? idx + 1 : null);
    }).catch(() => {});
  }, [open, playerId]);

  const stats = sumInventoryStats(inventory);

  return (
    <ModalDialog open={open} onClose={onClose} title={<ProfileTitle playerId={playerId} rank={rank} reputation={reputation} journeysWon={journeysWon} />}>
      {/* Stats row */}
      <div style={styles.statsRow}>
        <StatBadge icon={<GlyphReputation size={16} />} label="Rep" value={reputation} />
        <StatBadge icon={<GlyphLeaderboard size={16} />} label="Wins" value={journeysWon} />
        <StatBadge icon={<GlyphPower size={16} />} label="Power" value={stats.power} />
        <StatBadge icon={<GlyphVitality size={16} />} label="Vit" value={stats.vitality} />
        <StatBadge icon={<GlyphFocus size={16} />} label="Focus" value={stats.focus} />
        <StatBadge icon={<GlyphLuck size={16} />} label="Luck" value={stats.luck} />
        <StatBadge icon={<GlyphWeight size={16} />} label="Wt" value={stats.weight} />
      </div>

      {/* Fragment collection */}
      <h3 style={styles.sectionTitle}>Fragment Collection</h3>
      {inventory.length === 0 ? (
        <p style={styles.empty}>No fragments yet. Survive the dunes to collect artifacts.</p>
      ) : (
        <div style={styles.grid}>
          {inventory.map((item) => {
            const def = getArtifactById(item.artifactId);
            if (!def) return null;
            return (
              <div key={item.instanceId} style={{ ...styles.card, borderColor: rankColor(def.rank) }}>
                <div style={styles.cardTop}>
                  {categoryGlyph(def.category, 16)}
                  <span style={styles.cardName}>{def.displayName}</span>
                </div>
                <div style={styles.cardMid}>
                  <GlyphRank rank={def.rank} size={12} />
                  <span style={{ ...styles.cardRank, color: rankColor(def.rank) }}>{def.rank}</span>
                  <span style={styles.cardCategory}>{def.category}</span>
                </div>
                <div style={styles.cardStats}>
                  <MiniStat color="#ffd166" label="P">{def.stats.power}</MiniStat>
                  <MiniStat color="#ef476f" label="V">{def.stats.vitality}</MiniStat>
                  <MiniStat color="#118ab2" label="F">{def.stats.focus}</MiniStat>
                  <MiniStat color="#06d6a0" label="L">{def.stats.luck}</MiniStat>
                  <MiniStat color="#9a9a9a" label="W">{def.stats.weight}</MiniStat>
                </div>
                <p style={styles.flavor}>{def.flavorText}</p>
              </div>
            );
          })}
        </div>
      )}

      {/* Mini leaderboard */}
      <h3 style={styles.sectionTitle}>Wanderer Rankings</h3>
      <div style={styles.lbList}>
        {lb.slice(0, 5).map((entry, i) => (
          <div key={entry.playerId} style={{ ...styles.lbRow, background: entry.playerId === playerId ? "rgba(255,209,102,0.08)" : "transparent" }}>
            <span style={styles.lbPos}>#{i + 1}</span>
            <span style={styles.lbName}>{entry.displayName ?? entry.playerId.slice(0, 12)}</span>
            <span style={styles.lbRep}>{entry.reputation} rep</span>
          </div>
        ))}
        {rank && rank > 5 && (
          <div style={{ ...styles.lbRow, background: "rgba(255,209,102,0.12)" }}>
            <span style={styles.lbPos}>#{rank}</span>
            <span style={styles.lbName}>You</span>
            <span style={styles.lbRep}>{reputation} rep</span>
          </div>
        )}
      </div>
    </ModalDialog>
  );
}

function ProfileTitle({ playerId, rank, reputation, journeysWon }: { playerId: string; rank: number | null; reputation: number; journeysWon: number }) {
  return (
    <div style={styles.titleWrap}>
      <div style={styles.avatar}>
        {playerId.slice(0, 2).toUpperCase()}
      </div>
      <div>
        <div style={styles.name}>{playerId.length > 16 ? playerId.slice(0, 6) + "..." + playerId.slice(-4) : playerId}</div>
        <div style={styles.subtitle}>
          {rank ? `Rank #${rank}` : "Unranked"} · {reputation} rep · {journeysWon} wins
        </div>
      </div>
    </div>
  );
}

function StatBadge({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <div style={styles.statBadge}>
      {icon}
      <span style={styles.statValue}>{value}</span>
      <span style={styles.statLabel}>{label}</span>
    </div>
  );
}

function MiniStat({ color, label, children }: { color: string; label: string; children: React.ReactNode }) {
  return (
    <span style={{ ...styles.miniStat, color }}>
      {label}{children}
    </span>
  );
}

function rankColor(rank: string): string {
  switch (rank) {
    case "legendary": return "#fbbf24";
    case "epic": return "#c084fc";
    case "rare": return "#60a5fa";
    case "uncommon": return "#4ade80";
    default: return "#9a9a9a";
  }
}

const styles: Record<string, React.CSSProperties> = {
  titleWrap: { display: "flex", alignItems: "center", gap: 12 },
  avatar: {
    width: 44, height: 44, borderRadius: "50%",
    background: "linear-gradient(135deg, #ffd166, #ef476f)",
    display: "flex", alignItems: "center", justifyContent: "center",
    fontWeight: 800, fontSize: 14, color: "#1b1f3b",
  },
  name: { fontWeight: 800, fontSize: 16, color: "#1b1f3b" },
  subtitle: { fontSize: 11, color: "#3d4466", fontWeight: 600 },
  statsRow: {
    display: "flex", gap: 8, flexWrap: "wrap" as const,
    margin: "14px 0", padding: 10,
    background: "#f0f0ff", borderRadius: 12,
  },
  statBadge: {
    display: "flex", flexDirection: "column" as const,
    alignItems: "center", gap: 2, minWidth: 42,
    color: "#1b1f3b",
  },
  statValue: { fontWeight: 800, fontSize: 14 },
  statLabel: { fontSize: 9, fontWeight: 700, textTransform: "uppercase" as const, color: "#3d4466" },
  sectionTitle: { fontWeight: 800, fontSize: 14, margin: "16px 0 8px", color: "#1b1f3b" },
  empty: { fontSize: 12, color: "#3d4466", fontStyle: "italic" },
  grid: {
    display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
    gap: 8, maxHeight: 320, overflowY: "auto" as const, paddingRight: 4,
  },
  card: {
    border: "2px solid #9a9a9a", borderRadius: 12,
    padding: 10, background: "#fafaff",
  },
  cardTop: { display: "flex", alignItems: "center", gap: 6, marginBottom: 4 },
  cardName: { fontWeight: 800, fontSize: 12, color: "#1b1f3b" },
  cardMid: { display: "flex", alignItems: "center", gap: 4, marginBottom: 4 },
  cardRank: { fontWeight: 700, fontSize: 10, textTransform: "capitalize" as const },
  cardCategory: { fontSize: 10, color: "#3d4466", fontWeight: 600, marginLeft: "auto" },
  cardStats: { display: "flex", gap: 6, marginBottom: 2 },
  miniStat: { fontWeight: 800, fontSize: 10 },
  flavor: { margin: "4px 0 0", fontSize: 10, color: "#3d4466", fontStyle: "italic", lineHeight: 1.3 },
  lbList: { display: "flex", flexDirection: "column" as const, gap: 4 },
  lbRow: {
    display: "flex", alignItems: "center", gap: 8,
    padding: "6px 10px", borderRadius: 8,
    fontWeight: 600, fontSize: 13,
  },
  lbPos: { fontWeight: 800, color: "#ffd166", width: 28 },
  lbName: { flex: 1, color: "#1b1f3b" },
  lbRep: { color: "#3d4466", fontSize: 11 },
};
