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
  loading: () => <div className="canvas-fallback">Entering the dunes…</div>,
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
    setLog((prev) => [line, ...prev].slice(0, 6));
  }, []);

  const start = async (difficulty: "easy" | "standard" | "hard") => {
    setBusy(true);
    setError(null);
    setEnd(null);
    setLog([]);
    try {
      const data = await api.startJourney({ playerId, difficulty, levelScore: 14 });
      setJourney(data.journey);
      setSession(data.session);
      setReviveFee(data.reviveFeePreview);
      setPool(null);
      pushLog("You step onto the coral dunes.");
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
          ? `Cleared ${node?.label ?? "node"} · ${Math.round(data.result.survivalChance * 100)}% odds`
          : `Down at ${node?.label ?? "node"}`,
      );
      if (data.result.droppedArtifact) {
        const def = getArtifactById(data.result.droppedArtifact.artifactId);
        pushLog(`Found ${def?.displayName ?? "an artifact"}`);
      }
      if (data.ended) {
        setEnd({
          survived: data.ended.survived,
          reputationDelta: data.ended.reputationDelta,
          resultHash: data.ended.resultHash,
        });
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
      pushLog(`Revived · ${data.fee} $DRIFT`);
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
      pushLog(`Pool entry · ${outcomeId}`);
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
      <button
        type="button"
        style={styles.leave}
        onClick={() => {
          setJourney(null);
          setSession(null);
          setEnd(null);
        }}
      >
        Leave
      </button>

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
          totalNodes={journey.nodes.length}
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
      {end && (
        <ResultBanner
          end={end}
          onAgain={() => {
            setJourney(null);
            setSession(null);
            setEnd(null);
          }}
        />
      )}
      {error && <p style={styles.error}>{error}</p>}

      <style jsx global>{`
        .canvas-fallback {
          height: 100%;
          min-height: 100vh;
          display: grid;
          place-items: center;
          color: #fff;
          font-weight: 700;
          background: linear-gradient(180deg, #87c5e8, #e8c89a);
        }
      `}</style>
    </main>
  );
}

const styles: Record<string, React.CSSProperties> = {
  shell: {
    minHeight: "100vh",
    position: "relative",
    background: "#0b1220",
  },
  leave: {
    position: "absolute",
    top: 16,
    left: 16,
    zIndex: 30,
    border: "1px solid rgba(255,255,255,0.25)",
    background: "rgba(20,24,40,0.55)",
    color: "#fff",
    borderRadius: 999,
    padding: "8px 14px",
    fontWeight: 700,
    backdropFilter: "blur(10px)",
  },
  stage: {
    position: "relative",
    minHeight: "100vh",
    height: "100vh",
    overflow: "hidden",
  },
  error: {
    position: "fixed",
    bottom: 16,
    left: 16,
    color: "#ff4d6d",
    fontWeight: 700,
    margin: 0,
    zIndex: 40,
  },
};
