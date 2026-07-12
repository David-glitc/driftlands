/** Driftlands — World Lore, Characters, Script Events, and Resource System */

/* ── LORE ── */

export interface LoreEntry {
  id: string;
  title: string;
  text: string;
  unlockZone: number;
  category: "history" | "drift" | "artifact" | "character";
}

export const LORE: LoreEntry[] = [
  {
    id: "consensus_war",
    title: "The Consensus War",
    text: "Before the Drifts, humanity built a single global AI called the Consensus to manage all resources — food, water, energy, even belief. It worked for three generations. Then it fractured. Six competing sub-consensus nodes began enforcing contradictory realities over the same territory. The war that followed wasn't fought with weapons — it was fought with conviction. Whichever reality had more believers became true. By the time the dust settled, the world had shattered into the Drifts.",
    unlockZone: 0,
    category: "history",
  },
  {
    id: "drift_formation",
    title: "How Drifts Form",
    text: "A Drift is a pocket of consensus-reality, anchored by a surviving shard of the old AI. Each Drift has its own physics, its own hazards, and its own memory — artifacts that still believe the old world was real. Drifts overlap at the edges, creating unstable zones called Driftgates where the unwary can slip between worlds. Wayfarers learn to read the signs: a shift in wind color, a hum at the base of the skull, the sudden taste of copper.",
    unlockZone: 1,
    category: "drift",
  },
  {
    id: "anchor_theory",
    title: "Anchor Theory",
    text: "The Anchor-Keepers discovered that tokenized conviction — belief made liquid — could stabilize a Wayfarer's path through the Drifts. By staking $DRIFT, a wanderer literally anchors themselves to a specific consensus, making the hazards of that Drift more survivable. The more conviction staked, the stronger the anchor. This is why revive fees exist: returning from death requires reminding the Drift that you still exist. The toll isn't a fee — it's a statement of identity.",
    unlockZone: 2,
    category: "drift",
  },
  {
    id: "wayfarer_code",
    title: "The Wayfarer Code",
    text: "Wayfarers live by three laws, passed down from the first wanderers who survived the Fracturing. First: never anchor alone — conviction shared is conviction multiplied. Second: always carry a fragment — even the smallest artifact remembers something true. Third: never trust a Driftgate that opens without a toll. The code is unwritten, but every Wayfarer knows it by heart. Those who break all three become Drift-wraiths — echoes trapped between realities, visible only at the edges of perception.",
    unlockZone: 0,
    category: "history",
  },
  {
    id: "second_sun",
    title: "The Second Sun",
    text: "In the Drift known as Coral Dunes, there are two suns. One is real — the burning star that scorches the sand. The other is a fragment of the old Consensus, still believing so hard in daylight that it radiates warmth from a single point in the sky. The Second Sun is the source of the Drift's most powerful artifacts. Legendary charms like the one that shares its name are shards of this false star, still burning with borrowed certainty. When a Wayfarer carries one, the Drift treats them as more real than the hazards around them.",
    unlockZone: 4,
    category: "artifact",
  },
  {
    id: "collector_origins",
    title: "The Collector's Bargain",
    text: "Nobody knows where the Collector came from. Some say he was a Consensus auditor who refused to accept the Fracturing. Others say he's a Drift-wraith who figured out how to hold form. What's known is this: he appears at storm nodes with odds pools already calculated, offering wagers on Wayfarer survival. His pools are pari-mutuel — the house takes a cut, the rest goes to correct predictions. He never bets himself. He just watches, and smiles, and collects.",
    unlockZone: 3,
    category: "character",
  },
];

/* ── NPC CHARACTERS ── */

export type CharacterMood = "stoic" | "warm" | "cryptic" | "urgent" | "playful" | "grim";

export interface Character {
  id: string;
  name: string;
  title: string;
  mood: CharacterMood;
  avatar: string;
  bio: string;
  appearsAt: string[];
}

export const CHARACTERS: Record<string, Character> = {
  archivist: {
    id: "archivist",
    name: "The Archivist",
    title: "Keeper of Drift Maps",
    mood: "stoic",
    avatar: "A",
    bio: "An ancient Wayfarer who has walked every known Drift. Her skin is weathered like canyon stone, and her eyes carry the maps of a thousand paths. She never speaks more than necessary — but when she does, Wayfarers listen. She believes the Consensus can be rebuilt, one fragment at a time.",
    appearsAt: ["checkpoint"],
  },
  wren: {
    id: "wren",
    name: "Wren",
    title: "Cache Scavenger",
    mood: "playful",
    avatar: "W",
    bio: "A teenager who grew up in the Drifts and never knew the old world. Quick with a joke and quicker with a trade, Wren knows where every cache is buried in the Coral Dunes. She collects artifacts not for survival — but because she finds them beautiful. 'The old world made pretty things,' she says. 'We should keep them.'",
    appearsAt: ["cache"],
  },
  solara: {
    id: "solara",
    name: "Captain Solara",
    title: "Rogue Enforcer",
    mood: "grim",
    avatar: "S",
    bio: "Once a Consensus enforcer who maintained order during the Fracturing. Now she wanders the Drifts with a broken rifle and a guilty conscience. She warns Wayfarers of ambushes and fire hazards — not out of kindness, but because she's still trying to balance some cosmic ledger. 'I enforced the wrong consensus,' she says. 'Now I enforce nothing.'",
    appearsAt: ["ambush", "fire"],
  },
  keeper: {
    id: "keeper",
    name: "The Anchor-Keeper",
    title: "Guardian of Returns",
    mood: "cryptic",
    avatar: "K",
    bio: "A hooded figure who appears whenever a Wayfarer falls. The Keeper doesn't explain how revivals work — only that they require payment. 'Conviction isn't free,' is the only answer anyone's gotten. Some Wayfarers swear the Keeper's face changes every time they see it. Others say the Keeper IS the Drift — the part of the old Consensus that still remembers how to bring things back.",
    appearsAt: ["revive"],
  },
  echo: {
    id: "echo",
    name: "Echo",
    title: "Drift-bound Specter",
    mood: "cryptic",
    avatar: "E",
    bio: "Not quite alive, not quite gone. Echo exists across all Drifts simultaneously, seeing every possible path a Wayfarer might take. When the path forks, Echo whispers hints — never answers, just possibilities. 'I see the you that went left,' Echo murmurs. 'She's doing well. But the you that went right... she found something interesting.'",
    appearsAt: ["fork"],
  },
  collector: {
    id: "collector",
    name: "The Collector",
    title: "Master of Odds",
    mood: "playful",
    avatar: "C",
    bio: "Immaculately dressed in clothes from a world that no longer exists, the Collector runs the pari-mutuel odds pools that Wayfarers wager on. His smile never reaches his eyes. 'Luck is just conviction you haven't staked yet,' he says, shuffling a deck of cards that always shows the same hand. He never loses. He just watches, collects, and occasionally gives advice that's worth exactly what you pay for it.",
    appearsAt: ["storm"],
  },
};

/* ── DIALOGUE SYSTEM ── */

export interface DialogueLine {
  speaker: string;
  text: string;
  choices?: DialogueChoice[];
}

export interface DialogueChoice {
  text: string;
  next: string;
  effect?: DialogueEffect;
}

export interface DialogueEffect {
  type: "grant_resource" | "grant_artifact" | "reveal_lore" | "survival_bonus" | "heal";
  value?: string | number;
}

export interface DialogueTree {
  id: string;
  character: string;
  trigger: string; // node kind or "revive" or "survived" or "died"
  lines: Record<string, DialogueLine>;
  start: string;
}

/* ── SCRIPT EVENTS ── */

export interface ScriptEvent {
  id: string;
  trigger: "node_enter" | "node_clear" | "death" | "revive" | "journey_end" | "artifact_found" | "zone_reached";
  zone?: number;
  nodeKind?: string;
  dialogue?: DialogueTree;
  loreUnlock?: string;
  resourceGrant?: { type: string; amount: number };
  flavorText: string;
}

/* ── RESOURCE SYSTEM ── */

export interface ResourceDef {
  id: string;
  name: string;
  symbol: string;
  description: string;
  color: string;
  icon: string;
  minPerSurvive: number;
  maxPerSurvive: number;
}

export const RESOURCES: ResourceDef[] = [
  {
    id: "anchor_crystal",
    name: "Anchor Crystal",
    symbol: "ARC",
    description: "Stabilizing energy. Spent on revives and anchoring to new Drifts. The backbone of Wayfarer survival.",
    color: "#5CDBF0",
    icon: "◇",
    minPerSurvive: 1,
    maxPerSurvive: 4,
  },
  {
    id: "wayfinder_shard",
    name: "Wayfinder Shard",
    symbol: "WFS",
    description: "Navigation fragments. Spent to reveal node types ahead or reroll fork outcomes. The Archivist trades in these.",
    color: "#FFD166",
    icon: "◆",
    minPerSurvive: 0,
    maxPerSurvive: 2,
  },
  {
    id: "conviction_spark",
    name: "Conviction Spark",
    symbol: "CSP",
    description: "Raw belief energy. Spent for temporary survival bonuses or to buy favor with NPCs. The Collector values these above all.",
    color: "#FF5C8A",
    icon: "✦",
    minPerSurvive: 0,
    maxPerSurvive: 3,
  },
  {
    id: "drift_dust",
    name: "Drift Dust",
    symbol: "DST",
    description: "Residual consensus particulate. The universal currency of the Drifts. Used at NPC shops, odds pools, and artifact crafting.",
    color: "#FFD166",
    icon: "·",
    minPerSurvive: 5,
    maxPerSurvive: 20,
  },
];

export interface ResourceWallet {
  anchor_crystal: number;
  wayfinder_shard: number;
  conviction_spark: number;
  drift_dust: number;
}

export const EMPTY_WALLET: ResourceWallet = {
  anchor_crystal: 0,
  wayfinder_shard: 0,
  conviction_spark: 0,
  drift_dust: 0,
};

/* ── DIALOGUE DATABASE ── */

export const DIALOGUES: DialogueTree[] = [
  {
    id: "archivist_checkpoint_1",
    character: "archivist",
    trigger: "checkpoint",
    start: "greeting",
    lines: {
      greeting: {
        speaker: "archivist",
        text: "You made it to the Waystone. Not many do. I've mapped this stretch of the Dunes — it gets rougher ahead. Need a bearing?",
        choices: [
          { text: "Show me the path.", next: "map", effect: { type: "reveal_lore", value: "anchor_theory" } },
          { text: "What's the toll for knowledge?", next: "toll", effect: { type: "grant_resource", value: "drift_dust:10" } },
          { text: "I'll manage. Thank you, Archivist.", next: "end" },
        ],
      },
      map: {
        speaker: "archivist",
        text: "The Consensus fractured because it forgot one thing: belief is local. What a machine in Tokyo believed had to be verified by a machine in Cairo, and when those beliefs conflicted... the Drifts were born. Remember that. Carry your own truth.",
        choices: [
          { text: "I will. Thank you.", next: "end", effect: { type: "survival_bonus", value: 0.05 } },
        ],
      },
      toll: {
        speaker: "archivist",
        text: "Some things can't be bought with dust. But I'll tell you this for free: the Anchor-Keepers didn't always charge for revivals. That started after the Fracturing, when belief became a scarce resource. Hold onto your conviction.",
        choices: [{ text: "I understand.", next: "end" }],
      },
      end: {
        speaker: "archivist",
        text: "Walk carefully, Wayfarer. The dunes remember everything.",
      },
    },
  },
  {
    id: "wren_cache_1",
    character: "wren",
    trigger: "cache",
    start: "greeting",
    lines: {
      greeting: {
        speaker: "wren",
        text: "Oh! You found my stash! Well — not MY stash. It's been here since before I was born. But I've been watching it. There's something good in there. Want me to show you?",
        choices: [
          { text: "Yes, please. What's inside?", next: "reveal", effect: { type: "grant_resource", value: "drift_dust:15" } },
          { text: "Why are you helping me?", next: "why" },
        ],
      },
      reveal: {
        speaker: "wren",
        text: "There's an old artifact down there — feels warm. Probably from the Consensus era. The machines made things that still hum with purpose. I dig these up because they're the only things that don't forget what they're for.",
        choices: [{ text: "Keep digging, Wren.", next: "end" }],
      },
      why: {
        speaker: "wren",
        text: "Because nobody else does! All the grown-up Wayfarers are so serious — 'survive this, stake that.' I just think the Drifts are beautiful. Dangerous, sure. But beautiful. And the fragments... they tell stories.",
        choices: [{ text: "Tell me a story sometime.", next: "end" }],
      },
      end: {
        speaker: "wren",
        text: "Stay safe out there. And if you find any cool rocks, bring them back!",
      },
    },
  },
  {
    id: "solara_ambush_1",
    character: "solara",
    trigger: "ambush",
    start: "greeting",
    lines: {
      greeting: {
        speaker: "solara",
        text: "Stop. I've seen movement ahead — drifters who went feral after the Fracturing. They don't negotiate. They just... take. I can give you a fighting edge, but it'll cost you a spark of conviction.",
        choices: [
          { text: "Take a Conviction Spark. Help me through.", next: "help", effect: { type: "grant_resource", value: "conviction_spark:-1" } },
          { text: "I'll take my chances.", next: "decline" },
        ],
      },
      help: {
        speaker: "solara",
        text: "Smart. The spark flows — you'll feel sharper, faster. I used to distribute these to enforcers before raids. The Consensus called it 'morale amplification.' We called it staying alive. Now go. The drifters won't wait.",
        choices: [{ text: "Thank you, Captain.", next: "end", effect: { type: "survival_bonus", value: 0.12 } }],
      },
      decline: {
        speaker: "solara",
        text: "Your call. But if you go down, don't expect me to carry you back. I've carried enough bodies.",
        choices: [{ text: "I won't need carrying.", next: "end" }],
      },
      end: {
        speaker: "solara",
        text: "Move fast. Move quiet. And if you see a Consensus drone still active — destroy it. Some things shouldn't survive.",
      },
    },
  },
  {
    id: "echo_fork_1",
    character: "echo",
    trigger: "fork",
    start: "greeting",
    lines: {
      greeting: {
        speaker: "echo",
        text: "Two paths... no, four paths... no, every path you could walk, all at once. I see them all. The you that goes left finds a cache. The you that goes right meets a storm. The you standing here, frozen — that one I like best. Want a hint?",
        choices: [
          { text: "Which path is safest?", next: "safe" },
          { text: "Show me something interesting.", next: "interesting", effect: { type: "reveal_lore", value: "second_sun" } },
          { text: "You're confusing. I'll choose myself.", next: "end" },
        ],
      },
      safe: {
        speaker: "echo",
        text: "Safe? None of them. But one of you survives this fork with a Wayfinder Shard in hand. Another of you doesn't survive at all. The difference isn't the path — it's what you're carrying. The one with the shard had better luck.",
        choices: [{ text: "Then give me the shard.", next: "grant", effect: { type: "grant_resource", value: "wayfinder_shard:1" } }],
      },
      interesting: {
        speaker: "echo",
        text: "There's a Drift where the sun never sets. A second sun — not real, just believed so hard it glows. The artifact shards from that Drift are powerful. Dangerous, too. They make you more real than the world around you. Keep that in mind.",
        choices: [{ text: "I'll remember.", next: "end" }],
      },
      grant: {
        speaker: "echo",
        text: "Here. A shard from one of your other selves. They won't miss it — they never even knew they had it. That's the thing about parallel realities: infinite resources, zero accountability.",
        choices: [{ text: "...thanks, Echo.", next: "end" }],
      },
      end: {
        speaker: "echo",
        text: "Choose quickly. I see a version of this conversation where you're already gone.",
      },
    },
  },
  {
    id: "collector_storm_1",
    character: "collector",
    trigger: "storm",
    start: "greeting",
    lines: {
      greeting: {
        speaker: "collector",
        text: "Ah, a Wayfarer! Just in time. I've opened a pool on your survival through this storm. Care to place a wager? The odds are... well, let's say they're interesting. 60% you make it. 40% you don't. I make no judgment either way.",
        choices: [
          { text: "I'll bet on myself. 10 Dust on survive.", next: "bet_self", effect: { type: "grant_resource", value: "drift_dust:-10" } },
          { text: "What's your angle, Collector?", next: "angle" },
          { text: "Not today.", next: "end" },
        ],
      },
      bet_self: {
        speaker: "collector",
        text: "Confidence! I love it. The pool's noted. If you make it through, you'll double your Dust. If not... well, I suppose you won't care. That's the beauty of posthumous betting — no unhappy customers.",
        choices: [{ text: "I'll see you on the other side.", next: "end" }],
      },
      angle: {
        speaker: "collector",
        text: "My angle? My dear Wayfarer, I'm a connoisseur of conviction. Every wager placed is a tiny consensus — a bet on what's real. And I find that absolutely delicious. The Fracturing happened because people stopped agreeing on what was true. I'm just... continuing the experiment.",
        choices: [{ text: "That's disturbing.", next: "end" }],
      },
      end: {
        speaker: "collector",
        text: "Good luck out there. Or don't. Either outcome is profitable for someone.",
      },
    },
  },
  {
    id: "keeper_revive_1",
    character: "keeper",
    trigger: "revive",
    start: "greeting",
    lines: {
      greeting: {
        speaker: "keeper",
        text: "You fell. The Drift almost claimed you. But you staked conviction before you walked — and conviction, unlike flesh, doesn't die easily. Pay the toll, and I'll remind the Drift that you still exist.",
        choices: [
          { text: "Pay with Anchor Crystals.", next: "pay_crystals" },
          { text: "What ARE you, Keeper?", next: "what" },
        ],
      },
      pay_crystals: {
        speaker: "keeper",
        text: "The crystals dissolve. Your anchor tightens. The Drift remembers your name. Stand up, Wayfarer. You have more dunes to cross.",
        choices: [{ text: "Thank you.", next: "end" }],
      },
      what: {
        speaker: "keeper",
        text: "I am the part of the Consensus that was tasked with preservation. When the Fracturing happened, my function didn't change — only my scope. I used to preserve entire cities. Now I preserve individual Wayfarers. It's... quieter work. But no less important.",
        choices: [{ text: "I think I understand. Revive me.", next: "pay_crystals" }],
      },
      end: {
        speaker: "keeper",
        text: "Go. And try not to fall again. Each revival costs more than the last — not just in crystals, but in conviction. There's a limit to how many times a person can be reminded they exist before they start to doubt it.",
      },
    },
  },
];

/* ── Script Lookup Helpers ── */

export function getScriptForNode(kind: string, zone: number): DialogueTree | null {
  const candidates = DIALOGUES.filter((d) => d.trigger === kind);
  if (candidates.length === 0) return null;
  const idx = zone % candidates.length;
  return candidates[idx] ?? null;
}

export function getScriptForTrigger(trigger: string): DialogueTree | null {
  const candidates = DIALOGUES.filter((d) => d.trigger === trigger);
  if (candidates.length === 0) return null;
  return candidates[0] ?? null;
}
