"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useState } from "react";
import type { EquippedArtifact, JourneySeed, OddsPoolView, PlayerSession } from "@driftlands/shared";
import { getArtifactById } from "@driftlands/shared";
import { api } from "@/lib/api";
import { Hud } from "@/components/Hud";
import { DeathModal } from "@/components/DeathModal";
import { OddsPoolPanel } from "@/components/OddsPoolPanel";
import { Landing } from "@/components/Landing";
import { ResultBanner } from "@/components/ResultBanner";

const JourneyCanvas = dynamic(() => import("@/components/JourneyCanvas").then((m) => m.JourneyCanvas), {
  ssr: false,
  loading: () => <div className="canvas-fallback">Loading dunes…</div>,
});

type EndState = {
  survived: boolean;
  reputationDelta: number;
  resultHash: string;
};

export default function HomePage() {
  const [playerId, setPlayerId] = useState("demo_wanderer");
  const [journey, setJourney] = useState<JourneySeed | null>(null);
  const [session, setSession] = useState<PlayerSession | null>(null);
  const [pool, setPool] = useState<OddsPoolView | null>(null);
  const [reviveFee, setReviveFee] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [log, setLog] = useState<string[]>([]);
  const [end, setEnd] = useState<EndState | null>(null);
  const [error, setError] = useState<string | null>(null);

  const pushLog = useCallback((line: string) => {
    setLog((prev) => [line, ...prev].slice(0, 8));
  }, []);

  const start = async (difficulty: "easy" | "standard" | "hard") => {
    setBusy(true);
    setError(null);
    setEnd(null);
    try {
      const data = await api.startJourney({ playerId, difficulty, levelScore: 14 });
      setJourney(data.journey);
      setSession(data.session);
      setReviveFee(data.reviveFeePreview);
      setPool(null);
      pushLog(`Journey ${data.journey.journeyId} — coral dunes await.`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to start");
    } finally {
      setBusy(false);
    }
  };

  const advance = async () => {
    if (!journey || busy) return;
    setBusy(true);
    setError(null);
    try {
      const data = await api.advance(journey.journeyId);
      setSession(data.session);
      if (data.pool) setPool(data.pool);
      const node = journey.nodes.find((n) => n.nodeId === data.result.nodeId);
      pushLog(
        data.result.survived
          ? `Cleared ${node?.label ?? data.result.nodeId} (${Math.round(data.result.survivalChance * 100)}% odds)`
          : `Fell at ${node?.label ?? data.result.nodeId}`,
      );
      if (data.result.droppedArtifact) {
        const def = getArtifactById(data.result.droppedArtifact.artifactId);
        pushLog(`Looted ${def?.displayName ?? data.result.droppedArtifact.artifactId}`);
      }
      if (data.ended) {
        setEnd({
          survived: data.ended.survived,
          reputationDelta: data.ended.reputationDelta,
          resultHash: data.ended.resultHash,
        });
        pushLog(data.ended.survived ? "You survived the drift." : "Permadeath — run over.");
      }
      if (data.session.status === "awaiting_revive") {
        const fresh = await api.getJourney(journey.journeyId);
        setReviveFee(fresh.reviveFeePreview);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Advance failed");
    } finally {
      setBusy(false);
    }
  };

  const revive = async () => {
    if (!journey) return;
    setBusy(true);
    try {
      const data = await api.revive(journey.journeyId);
      setSession(data.session);
      setReviveFee(null);
      pushLog(`Revived for ${data.fee} $DRIFT (demo).`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Revive failed");
    } finally {
      setBusy(false);
    }
  };

  const enterPool = async (outcomeId: string) => {
    if (!pool || !session) return;
    try {
      const data = await api.enterPool(pool.poolId, {
        playerId: session.playerId,
        outcomeId,
        amount: 0.5,
      });
      setPool(data.pool);
      pushLog(`Bought into pool: ${outcomeId}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Pool entry failed");
    }
  };

  useEffect(() => {
    const stored = typeof window !== "undefined" ? localStorage.getItem("dl_player") : null;
    if (stored) setPlayerId(stored);
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") localStorage.setItem("dl_player", playerId);
  }, [playerId]);

  if (!journey || !session) {
    return (
      <Landing
        playerId={playerId}
        onPlayerId={setPlayerId}
        onStart={start}
        busy={busy}
        error={error}
      />
    );
  }

  const inventory: EquippedArtifact[] = session.inventory;
  const currentNode = journey.nodes[session.zoneIndex];

  return (
    <main style={styles.shell}>
      <header style={styles.top}>
        <div>
          <p style={styles.brand}>DRIFTLANDS</p>
          <p style={styles.sub}>Coral Dunes · {journey.difficulty}</p>
        </div>
        <button type="button" style={styles.ghostBtn} onClick={() => { setJourney(null); setSession(null); setEnd(null); }}>
          Leave
        </button>
      </header>

      <div style={styles.stage}>
        <JourneyCanvas
          nodes={journey.nodes}
          zoneIndex={session.zoneIndex}
          status={session.status}
          inventory={inventory}
        />
        <Hud
          session={session}
          currentNode={currentNode}
          log={log}
          busy={busy}
          onAdvance={advance}
          canAdvance={session.status === "active" && !end}
        />
        {pool && !pool.resolved && session.status === "active" && (
          <OddsPoolPanel pool={pool} onEnter={enterPool} />
        )}
      </div>

      {session.status === "awaiting_revive" && (
        <DeathModal fee={reviveFee} reviveCount={session.reviveCount} busy={busy} onRevive={revive} />
      )}
      {end && <ResultBanner end={end} onAgain={() => { setJourney(null); setSession(null); setEnd(null); }} />}
      {error && <p style={styles.error}>{error}</p>}

      <style jsx global>{`
        .canvas-fallback {
          height: 100%;
          display: grid;
          place-items: center;
          color: #1b1f3b;
          font-weight: 700;
          background: linear-gradient(180deg, #5cdbf0, #ffd166);
        }
      `}</style>
    </main>
  );
}

const styles: Record<string, React.CSSProperties> = {
  shell: {
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column",
    padding: "16px 20px 28px",
    gap: 12,
  },
  top: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  brand: {
    margin: 0,
    fontFamily: '"Space Grotesk", sans-serif',
    fontWeight: 700,
    fontSize: "clamp(2rem, 5vw, 3.2rem)",
    letterSpacing: "-0.04em",
    color: "#1b1f3b",
    textShadow: "0 2px 0 #ffe08a",
  },
  sub: { margin: "4px 0 0", color: "#3d4466", fontWeight: 600 },
  ghostBtn: {
    border: "2px solid #1b1f3b",
    background: "transparent",
    borderRadius: 999,
    padding: "8px 16px",
    fontWeight: 700,
  },
  stage: {
    position: "relative",
    flex: 1,
    minHeight: "68vh",
    borderRadius: 28,
    overflow: "hidden",
    border: "3px solid #1b1f3b",
    boxShadow: "0 18px 0 #1b1f3b",
    background: "#3bb4e8",
  },
  error: {
    color: "#ff4d6d",
    fontWeight: 700,
    margin: 0,
  },
};
