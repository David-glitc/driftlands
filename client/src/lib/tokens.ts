"use client";

import { getTokenByMint, getTokenPrices } from "./jupiter";

export const KNOWN_MINTS = {
  SOL: "So11111111111111111111111111111111111111112",
  USDC: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
  USDT: "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB",
  DRIFT: "DRFTxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
  BONK: "DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263",
  JITOSOL: "J1toso1uCk3RLmjorhTtrVwY9HJ7X8V9yYac6Y7kGCPn",
  INF: "5oVNBeEEQvYi1cX3ir8Dx5n1P7pdxydbGF2X4TxVusJm",
};

export type TokenInfo = {
  mint: string;
  symbol: string;
  name: string;
  decimals: number;
  logoURI: string;
  priceUsd?: number;
  balance?: number;
  balanceUsd?: number;
};

function defaultLogo(symbol: string): string {
  return `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32"><rect width="32" height="32" rx="16" fill="#333"/><text x="16" y="22" text-anchor="middle" fill="white" font-size="14" font-weight="bold">${symbol.slice(0, 3)}</text></svg>`)}`;
}

export async function fetchTokenInfo(mints: string[]): Promise<Map<string, TokenInfo>> {
  const result = new Map<string, TokenInfo>();

  // Fetch Jupiter token list metadata and prices in parallel
  const [prices] = await Promise.all([
    getTokenPrices(mints),
  ]);

  for (const mint of mints) {
    const jupToken = await getTokenByMint(mint);
    const price = prices[mint]?.price;

    result.set(mint, {
      mint,
      symbol: jupToken?.symbol ?? "???",
      name: jupToken?.name ?? mint.slice(0, 8),
      decimals: jupToken?.decimals ?? 9,
      logoURI: jupToken?.logoURI ?? defaultLogo(jupToken?.symbol ?? "?"),
      priceUsd: price,
    });
  }

  return result;
}

export function formatUsd(value: number): string {
  if (value === 0) return "$0.00";
  if (value < 0.01) return "<$0.01";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatToken(value: number, decimals: number = 9): string {
  if (value < 1000) return value.toFixed(decimals > 6 ? 4 : 2);
  if (value < 1_000_000) return `${(value / 1_000).toFixed(2)}K`;
  return `${(value / 1_000_000).toFixed(2)}M`;
}
