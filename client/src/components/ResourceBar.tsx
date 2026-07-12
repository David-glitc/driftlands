"use client";

import type { ResourceWallet } from "@driftlands/shared";
import { RESOURCES } from "@driftlands/shared";

type Props = {
  wallet: ResourceWallet;
};

export function ResourceBar({ wallet }: Props) {
  return (
    <div style={styles.wrap}>
      {RESOURCES.map((res) => {
        const amount = wallet[res.id as keyof ResourceWallet] ?? 0;
        if (amount === 0 && res.id !== "anchor_crystal") return null;
        return (
          <div key={res.id} style={styles.resource}>
            <span style={{ ...styles.icon, color: res.color }}>{res.icon}</span>
            <span style={styles.amount}>{amount}</span>
            <span style={styles.symbol}>{res.symbol}</span>
          </div>
        );
      })}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  wrap: {
    display: "flex",
    gap: 12,
    alignItems: "center",
  },
  resource: {
    display: "flex",
    alignItems: "center",
    gap: 3,
    background: "rgba(255,255,255,0.08)",
    borderRadius: 8,
    padding: "3px 10px",
  },
  icon: {
    fontSize: 12,
    fontWeight: 800,
  },
  amount: {
    fontWeight: 800,
    fontSize: 12,
    color: "#fff",
  },
  symbol: {
    fontSize: 9,
    fontWeight: 700,
    color: "rgba(255,255,255,0.4)",
  },
};
