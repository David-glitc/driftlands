"use client";

import { useState, useEffect, useCallback } from "react";
import { getQuote, getSwapTransaction, type QuoteResponse, getTokenByMint } from "@/lib/jupiter";
import { KNOWN_MINTS, formatToken } from "@/lib/tokens";
import { ModalDialog } from "@/components/ModalDialog";

type Props = {
  open: boolean;
  onClose: () => void;
  defaultMint?: string;
  defaultDirection?: "buy" | "sell";
  walletAddress?: string;
};

const SOL = KNOWN_MINTS.SOL;
const USDC = KNOWN_MINTS.USDC;

export function SwapModal({ open, onClose, defaultMint = SOL, defaultDirection = "buy", walletAddress }: Props) {
  const [direction, setDirection] = useState<"buy" | "sell">(defaultDirection);
  const [inputMint, setInputMint] = useState(defaultDirection === "buy" ? SOL : defaultMint);
  const [outputMint, setOutputMint] = useState(defaultDirection === "buy" ? defaultMint : USDC);
  const [amount, setAmount] = useState("");
  const [quote, setQuote] = useState<QuoteResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [inputLabel, setInputLabel] = useState("SOL");
  const [outputLabel, setOutputLabel] = useState("???");

  useEffect(() => {
    setDirection(defaultDirection);
    setInputMint(defaultDirection === "buy" ? SOL : defaultMint);
    setOutputMint(defaultDirection === "buy" ? defaultMint : USDC);
  }, [defaultDirection, defaultMint]);

  useEffect(() => {
    Promise.all([
      getTokenByMint(inputMint),
      getTokenByMint(outputMint),
    ]).then(([i, o]) => {
      setInputLabel(i?.symbol ?? "???");
      setOutputLabel(o?.symbol ?? "???");
    }).catch(() => {});
  }, [inputMint, outputMint]);

  const fetchQuote = useCallback(async () => {
    if (!amount || isNaN(Number(amount))) return;
    setLoading(true);
    setError(null);
    try {
      const inputToken = await getTokenByMint(inputMint);
      const decimals = inputToken?.decimals ?? 9;
      const lamports = Math.floor(Number(amount) * Math.pow(10, decimals));
      const q = await getQuote({
        inputMint,
        outputMint,
        amount: lamports,
        slippageBps: 100,
      });
      setQuote(q);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Quote failed");
    } finally {
      setLoading(false);
    }
  }, [amount, inputMint, outputMint]);

  useEffect(() => {
    if (amount && Number(amount) > 0) {
      const t = setTimeout(fetchQuote, 400);
      return () => clearTimeout(t);
    }
    setQuote(null);
  }, [amount, fetchQuote]);

  const handleSwap = async () => {
    if (!quote || !walletAddress) return;
    setLoading(true);
    setError(null);
    try {
      const result = await getSwapTransaction({
        quoteResponse: quote,
        userPublicKey: walletAddress,
      });

      if (typeof window !== "undefined" && (window as any).solana) {
        const tx = Buffer.from(result.swapTransaction, "base64");
        const { signature } = await (window as any).solana.signAndSendTransaction(
          new Uint8Array(tx),
        );
        console.log("Swap tx:", signature);
        onClose();
      } else {
        setError("Wallet not connected — sign manually via Phantom/Backpack");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Swap failed");
    } finally {
      setLoading(false);
    }
  };

  const flip = () => {
    setInputMint(outputMint);
    setOutputMint(inputMint);
    setDirection(direction === "buy" ? "sell" : "buy");
    setAmount("");
    setQuote(null);
  };

  const outputAmount = quote
    ? Number(quote.outAmount) / Math.pow(10, 6)
    : null;

  return (
    <ModalDialog open={open} onClose={onClose} title={direction === "buy" ? `Buy ${outputLabel}` : `Sell ${inputLabel}`}>
      <div style={styles.form}>
        <div style={styles.amountRow}>
          <input
            type="number"
            placeholder="0.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            style={styles.input}
            min="0"
            step="any"
          />
          <span style={styles.denom}>{inputLabel}</span>
        </div>

        <button type="button" style={styles.flipBtn} onClick={flip}>
          &#8645;
        </button>

        <div style={styles.amountRow}>
          <input
            type="text"
            readOnly
            value={outputAmount ? formatToken(outputAmount, 6) : "---"}
            style={{ ...styles.input, background: "rgba(255,255,255,0.03)" }}
          />
          <span style={styles.denom}>{outputLabel}</span>
        </div>

        {quote && (
          <div style={styles.quoteInfo}>
            <span>Rate: 1 {inputLabel} = {formatToken(Number(quote.outAmount) / Number(quote.inAmount), 4)} {outputLabel}</span>
            <span>Price impact: {Number(quote.priceImpactPct).toFixed(3)}%</span>
            <span>Route: {quote.routePlan.map((r) => r.swapInfo.label).join(" → ")}</span>
          </div>
        )}

        {error && <p style={styles.error}>{error}</p>}

        <button
          type="button"
          disabled={!quote || loading || !walletAddress}
          style={{
            ...styles.swapBtn,
            background: direction === "buy" ? "#4ade80" : "#ef476f",
            opacity: quote && walletAddress ? 1 : 0.4,
          }}
          onClick={handleSwap}
        >
          {loading ? "Loading..." : direction === "buy" ? `Buy ${outputLabel}` : `Sell ${inputLabel}`}
        </button>
      </div>
    </ModalDialog>
  );
}

const styles: Record<string, React.CSSProperties> = {
  form: {
    display: "flex",
    flexDirection: "column" as const,
    gap: 10,
  },
  amountRow: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    background: "rgba(0,0,0,0.05)",
    borderRadius: 14,
    padding: "4px 14px",
  },
  input: {
    flex: 1,
    border: "none",
    background: "transparent",
    fontSize: 22,
    fontWeight: 700,
    color: "#1b1f3b",
    outline: "none",
    fontFamily: "inherit",
  },
  denom: {
    fontWeight: 800,
    fontSize: 14,
    color: "#3d4466",
  },
  flipBtn: {
    alignSelf: "center",
    border: "2px solid #1b1f3b",
    borderRadius: 12,
    background: "#ffd166",
    width: 36,
    height: 36,
    fontSize: 18,
    fontWeight: 800,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  quoteInfo: {
    display: "flex",
    flexDirection: "column" as const,
    gap: 4,
    fontSize: 11,
    color: "#3d4466",
    fontWeight: 600,
    padding: "8px 12px",
    background: "rgba(0,0,0,0.03)",
    borderRadius: 10,
  },
  error: {
    color: "#ef476f",
    fontWeight: 700,
    fontSize: 12,
    margin: 0,
  },
  swapBtn: {
    border: "3px solid #1b1f3b",
    borderRadius: 14,
    padding: "14px",
    fontWeight: 800,
    fontSize: 16,
    color: "#fff",
    cursor: "pointer",
    marginTop: 4,
  },
};
