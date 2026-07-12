import {
  type DialogueTree,
  type ResourceWallet,
  RESOURCES,
  EMPTY_WALLET,
} from "@driftlands/shared";

const playerWallets = new Map<string, ResourceWallet>();

export function getWallet(playerId: string): ResourceWallet {
  if (!playerWallets.has(playerId)) {
    playerWallets.set(playerId, { ...EMPTY_WALLET });
  }
  return playerWallets.get(playerId)!;
}

function grantResource(playerId: string, resourceId: string, amount: number): void {
  const wallet = getWallet(playerId);
  const key = resourceId as keyof ResourceWallet;
  wallet[key] = Math.max(0, (wallet[key] ?? 0) + amount);
}

function logResourceChange(_playerId: string, resourceId: string, amount: number): string {
  const def = RESOURCES.find((r) => r.id === resourceId);
  const sym = def?.symbol ?? resourceId;
  return `${amount > 0 ? "+" : ""}${amount} ${sym}`;
}

export function executeChoice(
  dialogue: DialogueTree,
  lineId: string,
  choiceIndex: number,
  playerId: string,
): { nextLine: NonNullable<(typeof dialogue.lines)[string]>; effects: string[] } {
  const line = dialogue.lines[lineId];
  if (!line?.choices?.[choiceIndex]) {
    throw new Error("Invalid dialogue choice");
  }

  const choice = line.choices[choiceIndex]!;
  const effects: string[] = [];

  if (choice.effect) {
    const eff = choice.effect;
    switch (eff.type) {
      case "grant_resource": {
        const parts = String(eff.value ?? "0").split(":");
        const resId = parts[0] ?? "drift_dust";
        const amt = parseInt(parts[1] ?? "0", 10);
        grantResource(playerId, resId, amt);
        effects.push(logResourceChange(playerId, resId, amt));
        break;
      }
      case "survival_bonus":
        effects.push(`Survival +${Number(eff.value ?? 0) * 100}% this node`);
        break;
      case "reveal_lore":
        effects.push(`Lore unlocked: ${eff.value}`);
        break;
      case "grant_artifact":
        effects.push(`Artifact received: ${eff.value}`);
        break;
      case "heal":
        effects.push("HP restored");
        break;
    }
  }

  const nextLine = dialogue.lines[choice.next];
  if (!nextLine) throw new Error("Missing dialogue line: " + choice.next);
  return { nextLine, effects };
}

export function earnSurvivalResources(playerId: string, zoneIndex: number): string[] {
  const msgs: string[] = [];

  const crystalRoll = Math.random();
  if (crystalRoll > 0.3) {
    const amt = 1 + Math.floor(Math.random() * 3);
    grantResource(playerId, "anchor_crystal", amt);
    msgs.push(`+${amt} Anchor Crystal`);
  }

  if (zoneIndex > 1 && Math.random() > 0.5) {
    grantResource(playerId, "wayfinder_shard", 1);
    msgs.push("+1 Wayfinder Shard");
  }

  const dustAmt = 5 + Math.floor(Math.random() * 15);
  grantResource(playerId, "drift_dust", dustAmt);
  msgs.push(`+${dustAmt} Drift Dust`);

  return msgs;
}
