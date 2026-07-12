"use client";

import { useEffect, useState } from "react";
import type { WandererProfile } from "@driftlands/shared";
import { ACHIEVEMENTS, COSMETICS, xpToNextRank, streakReward } from "@driftlands/shared";
import { api } from "@/lib/api";
import { ModalDialog } from "@/components/ModalDialog";
import { GlyphReputation } from "@/components/Glyphs";

type Props = {
  open: boolean;
  onClose: () => void;
  playerId: string;
};

export function FullProfilePage({ open, onClose, playerId }: Props) {
  const [profile, setProfile] = useState<WandererProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    api.request<any>(`/profile/${playerId}`).then((d) => {
      setProfile(d.profile);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [open, playerId]);

  if (loading || !profile) {
    return <ModalDialog open={open} onClose={onClose} title="Profile"><p style={{ color: "#3d4466" }}>Loading...</p></ModalDialog>;
  }

  const rank = profile.rank;
  const nextRank = xpToNextRank(profile.xp);
  const winRate = profile.journeysCompleted > 0 ? Math.round((profile.journeysSurvived / profile.journeysCompleted) * 100) : 0;

  return (
    <ModalDialog open={open} onClose={onClose} title={profile.displayName} wide>
      {/* Rank header */}
      <div style={{ ...s.rankCard, background: rank.cloakColor + "22", borderColor: rank.cloakColor }}>
        <div style={s.rankIcon}><span style={{ fontSize: 28 }}>{rank.badge}</span></div>
        <div>
          <div style={s.rankName}>{rank.name}</div>
          <div style={s.rankBar}>
            <div style={{ ...s.rankFill, width: `${nextRank.progress * 100}%`, background: rank.cloakColor }} />
          </div>
          <div style={s.rankXp}>
            {profile.xp} XP {nextRank.next ? `/ ${nextRank.next.xpRequired} XP → ${nextRank.next.name}` : "· MAX RANK"}
          </div>
        </div>
      </div>

      {/* Stats grid */}
      <div style={s.statsGrid}>
        <StatBox icon="🏆" label="Rank" value={rank.name} />
        <StatBox icon="⚡" label="Win Rate" value={`${winRate}%`} />
        <StatBox icon={<GlyphReputation size={16} />} label="Rep" value={profile.reputation.toString()} />
        <StatBox icon="🗺️" label="Zones" value={profile.totalZones.toString()} />
        <StatBox icon="☠️" label="Revives" value={profile.totalRevives.toString()} />
        <StatBox icon={rank.cloakColor} label="Cloak" value={rank.cloakColor} />
      </div>

      {/* Streak */}
      <div style={s.streakBar}>
        <div style={{ ...s.streakDot, background: profile.streak.currentStreak >= 7 ? "#fbbf24" : profile.streak.currentStreak >= 3 ? "#4ade80" : "#9a9a9a" }} />
        <div>
          <div style={s.streakTitle}>
            {profile.streak.currentStreak}-Day Streak
            <span style={s.streakMultiplier}>+{Math.round((profile.streak.multiplier - 1) * 100)}% Dust</span>
          </div>
          <div style={s.streakSub}>
            Best: {profile.streak.longestStreak} days · {streakReward(profile.streak.currentStreak)}
          </div>
        </div>
      </div>

      {/* Badges */}
      <h3 style={s.sectionTitle}>Badges ({profile.badges.length}/{ACHIEVEMENTS.filter(a => !a.hidden).length})</h3>
      <div style={s.badgeGrid}>
        {ACHIEVEMENTS.filter((a) => !a.hidden).map((ach) => {
          const unlocked = profile.badges.includes(ach.id);
          return (
            <div key={ach.id} style={{ ...s.badgeCard, opacity: unlocked ? 1 : 0.35, borderColor: unlocked ? "#ffd166" : "#ddd" }}>
              <span style={s.badgeIcon}>{ach.icon}</span>
              <span style={s.badgeName}>{unlocked ? ach.name : "???"}</span>
              <span style={s.badgeDesc}>{unlocked ? ach.description : "Keep playing to unlock"}</span>
            </div>
          );
        })}
      </div>

      {/* Cosmetics */}
      <h3 style={s.sectionTitle}>Cosmetics</h3>
      <div style={s.cosmeticGrid}>
        {COSMETICS.map((c) => {
          const unlocked = profile.badges.length > 0 || profile.rank.tier > 0;
          return (
            <div key={c.id} style={{ ...s.cosmeticCard, opacity: unlocked ? 1 : 0.3 }}>
              <div style={{ ...s.cosmeticSwatch, background: c.color }}>
                {c.rarity === "legendary" && "★"}
              </div>
              <div style={s.cosmeticName}>{c.name}</div>
              <div style={s.cosmeticCondition}>{c.unlockCondition}</div>
              <div style={{ ...s.cosmeticRarity, color: c.rarity === "legendary" ? "#fbbf24" : c.rarity === "epic" ? "#c084fc" : c.rarity === "rare" ? "#60a5fa" : "#9a9a9a" }}>
                {c.rarity}
              </div>
            </div>
          );
        })}
      </div>

      {/* Progress */}
      <h3 style={s.sectionTitle}>Codex Progress</h3>
      <div style={s.codexGrid}>
        <CodexBar label="Artifacts" current={profile.artifactCount} total={profile.totalArtifacts} color="#ffd166" />
        <CodexBar label="Lore" current={profile.loreUnlocked} total={profile.totalLore} color="#5CDBF0" />
        <CodexBar label="NPCs Met" current={profile.npcsMet} total={profile.totalNpcs} color="#c084fc" />
        <CodexBar label="Journeys" current={profile.journeysCompleted} total={20} color="#4ade80" survived={profile.journeysSurvived} />
      </div>
    </ModalDialog>
  );
}

function StatBox({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div style={s.statBox}>
      <span style={s.statIcon}>{typeof icon === "string" && icon.startsWith("#") ? <span style={{ display: "inline-block", width: 12, height: 12, borderRadius: 3, background: icon, marginTop: 2 }} /> : icon}</span>
      <span style={s.statValue}>{value}</span>
      <span style={s.statLabel}>{label}</span>
    </div>
  );
}

function CodexBar({ label, current, total, color, survived }: {
  label: string; current: number; total: number; color: string; survived?: number;
}) {
  const pct = Math.min(100, (current / total) * 100);
  return (
    <div style={s.codexItem}>
      <div style={s.codexLabel}>{label}: {survived != null ? `${survived}/${current}` : `${current}/${total}`}</div>
      <div style={s.codexBar}>
        <div style={{ ...s.codexFill, width: `${pct}%`, background: color }} />
      </div>
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  rankCard: {
    display: "flex", gap: 14, alignItems: "center",
    padding: 16, borderRadius: 16, border: "2px solid",
    marginBottom: 16,
  },
  rankIcon: { width: 56, height: 56, borderRadius: "50%", background: "rgba(0,0,0,0.05)", display: "flex", alignItems: "center", justifyContent: "center" },
  rankName: { fontWeight: 800, fontSize: 20, color: "#1b1f3b", marginBottom: 6 },
  rankBar: { height: 8, borderRadius: 4, background: "#e0e0e0", marginBottom: 4, width: "100%", minWidth: 120 },
  rankFill: { height: "100%", borderRadius: 4, transition: "width 0.5s" },
  rankXp: { fontSize: 10, fontWeight: 600, color: "#3d4466" },
  statsGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(100px, 1fr))", gap: 8, marginBottom: 16 },
  statBox: {
    display: "flex", flexDirection: "column", gap: 2, alignItems: "center",
    padding: 10, background: "#fafaff", borderRadius: 12,
  },
  statIcon: { fontSize: 16 },
  statValue: { fontWeight: 800, fontSize: 16, color: "#1b1f3b" },
  statLabel: { fontSize: 9, fontWeight: 700, textTransform: "uppercase", color: "#3d4466" },
  streakBar: {
    display: "flex", gap: 12, alignItems: "center",
    padding: 12, background: "linear-gradient(135deg, rgba(255,209,102,0.1), rgba(255,107,74,0.1))",
    borderRadius: 14, marginBottom: 16,
  },
  streakDot: { width: 14, height: 14, borderRadius: "50%", flexShrink: 0 },
  streakTitle: { fontWeight: 800, fontSize: 14, color: "#1b1f3b", display: "flex", gap: 8, alignItems: "center" },
  streakMultiplier: { background: "#ffd16622", color: "#b8860b", borderRadius: 6, padding: "2px 8px", fontSize: 10, fontWeight: 700 },
  streakSub: { fontSize: 11, color: "#3d4466", fontWeight: 600, marginTop: 2 },
  sectionTitle: { fontWeight: 800, fontSize: 14, margin: "14px 0 8px", color: "#1b1f3b" },
  badgeGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: 6, marginBottom: 16 },
  badgeCard: {
    display: "flex", flexDirection: "column", gap: 2,
    padding: "8px 10px", background: "#fafaff", borderRadius: 10, border: "1px solid",
    transition: "opacity 0.3s",
  },
  badgeIcon: { fontSize: 18 },
  badgeName: { fontWeight: 700, fontSize: 11, color: "#1b1f3b" },
  badgeDesc: { fontSize: 9, color: "#3d4466", fontWeight: 600 },
  cosmeticGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(100px, 1fr))", gap: 8, marginBottom: 16 },
  cosmeticCard: {
    display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
    padding: 10, background: "#fafaff", borderRadius: 12,
  },
  cosmeticSwatch: { width: 36, height: 36, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, color: "#fff" },
  cosmeticName: { fontWeight: 700, fontSize: 10, color: "#1b1f3b", textAlign: "center" },
  cosmeticCondition: { fontSize: 8, color: "#3d4466", textAlign: "center", fontWeight: 600 },
  cosmeticRarity: { fontSize: 8, fontWeight: 700, textTransform: "uppercase" },
  codexGrid: { display: "flex", flexDirection: "column", gap: 8 },
  codexItem: { display: "flex", flexDirection: "column", gap: 4 },
  codexLabel: { fontWeight: 700, fontSize: 11, color: "#1b1f3b" },
  codexBar: { height: 6, borderRadius: 3, background: "#e0e0e0", width: "100%" },
  codexFill: { height: "100%", borderRadius: 3, transition: "width 0.5s" },
};
