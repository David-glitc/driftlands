"use client";

const JUP_QUOTE = "https://quote-api.jup.ag/v6";
const JUP_PRICE = "https://price.jup.ag/v6";

export type JupiterToken = {
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  logoURI: string;
};

export type QuoteResponse = {
  inputMint: string;
  outputMint: string;
  inAmount: string;
  outAmount: string;
  otherAmountThreshold: string;
  swapMode: string;
  slippageBps: number;
  priceImpactPct: string;
  routePlan: Array<{ swapInfo: { label: string; ammKey: string } }>;
};

export type SwapResult = {
  swapTransaction: string;
};

export async function getQuote(params: {
  inputMint: string;
  outputMint: string;
  amount: number;
  slippageBps?: number;
}): Promise<QuoteResponse> {
  const url = new URL(`${JUP_QUOTE}/quote`);
  url.searchParams.set("inputMint", params.inputMint);
  url.searchParams.set("outputMint", params.outputMint);
  url.searchParams.set("amount", String(params.amount));
  url.searchParams.set("slippageBps", String(params.slippageBps ?? 100));

  const res = await fetch(url.toString());
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Jupiter quote failed: ${text}`);
  }
  return res.json();
}

export async function getSwapTransaction(params: {
  quoteResponse: QuoteResponse;
  userPublicKey: string;
  wrapAndUnwrapSol?: boolean;
}): Promise<SwapResult> {
  const res = await fetch(`${JUP_QUOTE}/swap`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      quoteResponse: params.quoteResponse,
      userPublicKey: params.userPublicKey,
      wrapAndUnwrapSol: params.wrapAndUnwrapSol ?? true,
      dynamicComputeUnitLimit: true,
      prioritizationFeeLamports: "auto",
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Jupiter swap failed: ${text}`);
  }
  return res.json();
}

export async function getTokenPrices(mints: string[]): Promise<Record<string, { price: number }>> {
  const ids = mints.join(",");
  const res = await fetch(`${JUP_PRICE}/price?ids=${ids}`);
  if (!res.ok) return {};
  const data = await res.json();
  return data.data ?? {};
}

let tokenListCache: JupiterToken[] | null = null;

export async function getTokenList(): Promise<JupiterToken[]> {
  if (tokenListCache) return tokenListCache;
  const res = await fetch("https://token.jup.ag/strict");
  if (!res.ok) return [];
  tokenListCache = await res.json();
  return tokenListCache!;
}

export async function getTokenByMint(mint: string): Promise<JupiterToken | undefined> {
  const list = await getTokenList();
  return list.find((t) => t.address === mint);
}
