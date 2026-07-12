"use client";

import { useEffect, useState } from "react";
import { KNOWN_MINTS, fetchTokenInfo, formatUsd, type TokenInfo } from "@/lib/tokens";

type Props = {
  onSwap?: (mint: string, direction: "buy" | "sell") => void;
  collapsed?: boolean;
};

export function TokenSidebar({ onSwap, collapsed = false }: Props) {
  const [tokens, setTokens] = useState<TokenInfo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const mints = Object.values(KNOWN_MINTS);
    fetchTokenInfo(mints).then((map) => {
      const list = mints.map((m) => map.get(m)!).filter(Boolean);
      setTokens(list);
      setLoading(false);
    }).catch(() => setLoading(false));

    const t = setInterval(() => {
      fetchTokenInfo(mints).then((map) => {
        const list = mints.map((m) => map.get(m)!).filter(Boolean);
        setTokens(list);
      }).catch(() => {});
    }, 30000);
    return () => clearInterval(t);
  }, []);

  if (collapsed) return null;

  return (
    <aside style={styles.wrap}>
      <div style={styles.header}>
        <span style={styles.headerTitle}>Tokens</span>
        {loading && <span style={styles.pulse} />}
      </div>

      {tokens.map((token) => (
        <div key={token.mint} style={styles.row}>
          <img
            src={token.logoURI}
            alt={token.symbol}
            style={styles.logo}
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = "none";
            }}
          />
          <div style={styles.info}>
            <span style={styles.symbol}>{token.symbol}</span>
            <span style={styles.price}>
              {token.priceUsd ? formatUsd(token.priceUsd) : "---"}
            </span>
          </div>
          <div style={styles.actions}>
            {onSwap && (
              <>
                <button
                  type="button"
                  style={styles.buyBtn}
                  onClick={() => onSwap(token.mint, "buy")}
                  title={`Buy ${token.symbol}`}
                >
                  Buy
                </button>
                <button
                  type="button"
                  style={styles.sellBtn}
                  onClick={() => onSwap(token.mint, "sell")}
                  title={`Sell ${token.symbol}`}
                >
                  Sell
                </button>
              </>
            )}
          </div>
        </div>
      ))}

      <div style={styles.footer}>
        <span style={styles.powered}>Powered by Jupiter</span>
      </div>
    </aside>
  );
}

const styles: Record<string, React.CSSProperties> = {
  wrap: {
    position: "fixed",
    top: 72,
    right: 16,
    zIndex: 30,
    width: 220,
    background: "rgba(20, 24, 40, 0.88)",
    border: "1px solid rgba(255,255,255,0.12)",
    borderRadius: 16,
    padding: 12,
    color: "#fff",
  },
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  headerTitle: {
    fontWeight: 800,
    fontSize: 13,
    color: "#ffd166",
  },
  pulse: {
    width: 6,
    height: 6,
    borderRadius: "50%",
    background: "#4ade80",
  },
  row: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    padding: "8px 0",
    borderBottom: "1px solid rgba(255,255,255,0.06)",
  },
  logo: {
    width: 28,
    height: 28,
    borderRadius: "50%",
    background: "#333",
  },
  info: {
    flex: 1,
    display: "flex",
    flexDirection: "column" as const,
    gap: 1,
  },
  symbol: {
    fontWeight: 700,
    fontSize: 12,
  },
  price: {
    fontSize: 10,
    color: "rgba(255,255,255,0.5)",
    fontWeight: 600,
  },
  actions: {
    display: "flex",
    gap: 4,
  },
  buyBtn: {
    border: "none",
    borderRadius: 8,
    padding: "4px 10px",
    background: "rgba(74,222,128,0.2)",
    color: "#4ade80",
    fontWeight: 700,
    fontSize: 10,
    cursor: "pointer",
  },
  sellBtn: {
    border: "none",
    borderRadius: 8,
    padding: "4px 10px",
    background: "rgba(239,71,111,0.2)",
    color: "#ef476f",
    fontWeight: 700,
    fontSize: 10,
    cursor: "pointer",
  },
  footer: {
    marginTop: 10,
    textAlign: "center" as const,
  },
  powered: {
    fontSize: 9,
    color: "rgba(255,255,255,0.3)",
    fontWeight: 600,
  },
};
