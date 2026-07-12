"use client";

import { useEffect, useState } from "react";
import { ModalDialog } from "@/components/ModalDialog";
import { KNOWN_MINTS, fetchTokenInfo, formatUsd, formatToken, type TokenInfo } from "@/lib/tokens";

type Props = {
  open: boolean;
  onClose: () => void;
  walletAddress?: string;
  onSwap?: (mint: string, direction: "buy" | "sell") => void;
};

export function Dashboard({ open, onClose, walletAddress, onSwap }: Props) {
  const [tokens, setTokens] = useState<TokenInfo[]>([]);
  const [totalUsd, setTotalUsd] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!open) return;
    const mints = Object.values(KNOWN_MINTS);
    fetchTokenInfo(mints).then((map) => {
      const list = mints.map((m) => map.get(m)!).filter(Boolean);
      setTokens(list);
      const total = list.reduce((sum, t) => {
        if (t.balanceUsd) return sum + t.balanceUsd;
        return sum;
      }, 0);
      setTotalUsd(total);
      setLoading(false);
    }).catch(() => setLoading(false));

    const t = setInterval(() => {
      fetchTokenInfo(mints).then((map) => {
        const list = mints.map((m) => map.get(m)!).filter(Boolean);
        setTokens(list);
        const total = list.reduce((sum, t) => sum + (t.balanceUsd ?? 0), 0);
        setTotalUsd(total);
      }).catch(() => {});
    }, 30000);
    return () => clearInterval(t);
  }, [open]);

  return (
    <ModalDialog open={open} onClose={onClose} title={<DashboardTitle walletAddress={walletAddress} />} wide>
      {/* Portfolio value */}
      <div style={styles.valueCard}>
        <span style={styles.valueLabel}>Portfolio Value</span>
        <span style={styles.valueAmount}>{loading ? "..." : formatUsd(totalUsd)}</span>
        <span style={styles.valueHint}>Estimated from spot prices via Jupiter</span>
      </div>

      {/* Asset list */}
      <h3 style={styles.sectionTitle}>Assets</h3>
      <div style={styles.assetList}>
        {tokens.map((token) => (
          <div key={token.mint} style={styles.assetRow}>
            <img
              src={token.logoURI}
              alt={token.symbol}
              style={styles.assetLogo}
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none";
              }}
            />
            <div style={styles.assetInfo}>
              <span style={styles.assetName}>{token.name}</span>
              <span style={styles.assetSymbol}>{token.symbol}</span>
            </div>
            <div style={styles.assetValues}>
              <span style={styles.assetBalance}>
                {token.balance ? formatToken(token.balance, token.decimals) : "---"}
              </span>
              <span style={styles.assetUsd}>
                {token.balanceUsd ? formatUsd(token.balanceUsd) : token.priceUsd ? formatUsd(token.priceUsd) : "---"}
              </span>
            </div>
            {onSwap && (
              <div style={styles.assetActions}>
                <button type="button" style={styles.buyBtn} onClick={() => onSwap(token.mint, "buy")}>
                  Buy
                </button>
                <button type="button" style={styles.sellBtn} onClick={() => onSwap(token.mint, "sell")}>
                  Sell
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Market info */}
      <h3 style={styles.sectionTitle}>Market</h3>
      <div style={styles.marketGrid}>
        {tokens.slice(0, 4).map((token) => (
          <div key={token.mint} style={styles.marketCard}>
            <span style={styles.marketSymbol}>{token.symbol}</span>
            <span style={styles.marketPrice}>
              {token.priceUsd ? formatUsd(token.priceUsd) : "---"}
            </span>
            <span style={styles.marketChange}>24h · via Jupiter</span>
          </div>
        ))}
      </div>
    </ModalDialog>
  );
}

function DashboardTitle({ walletAddress }: { walletAddress?: string }) {
  return (
    <div style={titleStyles.wrap}>
      <span style={titleStyles.label}>Dashboard</span>
      {walletAddress && (
        <span style={titleStyles.address}>
          {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
        </span>
      )}
    </div>
  );
}

const titleStyles: Record<string, React.CSSProperties> = {
  wrap: {
    display: "flex",
    flexDirection: "column" as const,
    gap: 2,
  },
  label: { fontWeight: 800, fontSize: 22 },
  address: { fontSize: 11, color: "#3d4466", fontFamily: "monospace" },
};

const styles: Record<string, React.CSSProperties> = {
  valueCard: {
    background: "linear-gradient(135deg, #ffd166 0%, #ff6b4a 100%)",
    borderRadius: 16,
    padding: 20,
    color: "#1b1f3b",
    display: "flex",
    flexDirection: "column" as const,
    gap: 4,
    marginBottom: 16,
  },
  valueLabel: { fontWeight: 700, fontSize: 12, opacity: 0.7 },
  valueAmount: { fontWeight: 800, fontSize: 28 },
  valueHint: { fontSize: 10, opacity: 0.5 },
  sectionTitle: {
    fontWeight: 800,
    fontSize: 14,
    margin: "14px 0 8px",
    color: "#1b1f3b",
  },
  assetList: {
    display: "flex",
    flexDirection: "column" as const,
    gap: 4,
  },
  assetRow: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "10px 12px",
    background: "#fafaff",
    borderRadius: 12,
    border: "1px solid rgba(0,0,0,0.05)",
  },
  assetLogo: {
    width: 36,
    height: 36,
    borderRadius: "50%",
    background: "#333",
  },
  assetInfo: {
    flex: 1,
    display: "flex",
    flexDirection: "column" as const,
    gap: 1,
  },
  assetName: { fontWeight: 700, fontSize: 13, color: "#1b1f3b" },
  assetSymbol: { fontSize: 10, color: "#3d4466", fontWeight: 600 },
  assetValues: {
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "flex-end" as const,
    gap: 1,
  },
  assetBalance: { fontWeight: 700, fontSize: 13, color: "#1b1f3b" },
  assetUsd: { fontSize: 10, color: "#3d4466", fontWeight: 600 },
  assetActions: {
    display: "flex",
    gap: 4,
    marginLeft: 4,
  },
  buyBtn: {
    border: "2px solid #4ade80",
    borderRadius: 8,
    padding: "4px 12px",
    background: "transparent",
    color: "#4ade80",
    fontWeight: 700,
    fontSize: 10,
    cursor: "pointer",
  },
  sellBtn: {
    border: "2px solid #ef476f",
    borderRadius: 8,
    padding: "4px 12px",
    background: "transparent",
    color: "#ef476f",
    fontWeight: 700,
    fontSize: 10,
    cursor: "pointer",
  },
  marketGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))",
    gap: 8,
  },
  marketCard: {
    background: "#fafaff",
    borderRadius: 12,
    padding: 12,
    border: "1px solid rgba(0,0,0,0.05)",
    display: "flex",
    flexDirection: "column" as const,
    gap: 2,
  },
  marketSymbol: {
    fontWeight: 800,
    fontSize: 16,
    color: "#1b1f3b",
  },
  marketPrice: {
    fontWeight: 700,
    fontSize: 13,
    color: "#3d4466",
  },
  marketChange: {
    fontSize: 9,
    color: "#9a9a9a",
    fontWeight: 600,
  },
};
