import { BIOMES, Biome } from './biomes';

export interface LevelConfig {
  level: number;
  biome: Biome;
  board: Array<Array<{ kind: string }>>;
  diff: number;
  isBoss: boolean;
  isActFinal: boolean;
  isMystery: boolean;
  rarity: 'COMMON' | 'EPIC' | 'ELITE' | 'BOSS' | 'MYTHIC';
  reward: number;
  goal: number;
  moves: number;
  targetType: string;
  title: string;
  phase: number;
}

// 8 acts × 5000 levels each = 40,000 total
const LEVELS_PER_ACT = 5000;

function levelToBiome(level: number): Biome {
  return BIOMES[Math.min(7, Math.floor((level - 1) / LEVELS_PER_ACT))];
}

function rngFromSeed(seedHex: string) {
  let x = 0;
  for (let i = 0; i < seedHex.length; i++) x = ((x << 5) - x + seedHex.charCodeAt(i)) | 0;
  return () => {
    x ^= x << 13; x ^= x >>> 17; x ^= x << 5;
    return (x >>> 0) / 0xffffffff;
  };
}

export function levelConfig(level: number, seedHex?: string): LevelConfig {
  const biome = levelToBiome(level);
  const localIdx = level - biome.range[0];
  const phase = localIdx / (LEVELS_PER_ACT - 1);
  const rng = rngFromSeed(seedHex ?? String(level * 2654435761));

  const diff = +(biome.act + phase * 1.4).toFixed(2);
  const isBoss = level % 50 === 0;
  const isActFinal = level === biome.range[1];
  const isMystery = level % 5 === 0 && !isBoss;
  const rarity: LevelConfig['rarity'] =
    isActFinal ? 'MYTHIC' : isBoss ? 'BOSS' :
    level % 250 === 0 ? 'ELITE' : level % 100 === 0 ? 'EPIC' : 'COMMON';
  const baseReward = 5 + biome.act * 12 + Math.floor(phase * 60);
  const reward = Math.round(
    isActFinal ? baseReward * 8 : isBoss ? baseReward * 3 : isMystery ? baseReward * 1.5 : baseReward,
  );
  const goal = 18 + Math.floor(phase * 32) + (isBoss ? 30 : 0);
  const moves = 22 + Math.floor(phase * 18) + (isBoss ? 0 : 4);
  const targetType = biome.blocks[level % biome.blocks.length];

  const board: LevelConfig['board'] = [];
  for (let y = 0; y < 8; y++) {
    const row: { kind: string }[] = [];
    for (let x = 0; x < 8; x++) {
      const r = rng();
      row.push({ kind: r < 0.06 ? 'empty' : biome.blocks[Math.floor(rng() * biome.blocks.length)] });
    }
    board.push(row);
  }

  const titles: Record<string, string[]> = {
    crystal: ['Echo Chamber', 'Crystal Heart', 'Shard Storm', 'Geode Vault', 'Rune Awakening'],
    frost:   ['Aurora Run', 'Glacier Path', 'Frost Bite', 'Ice Break', 'Snowfall'],
    ember:   ['Forge Trial', 'Magma Rush', 'Cinder Rain', 'Phoenix Rise', 'Inferno'],
    verdant: ['Bloom Field', 'Vine Tangle', 'Pollen Burst', 'Mushroom Ring', 'Overgrowth'],
    tidewave:['Pearl Dive', 'Kraken Deep', 'Tide Pull', 'Coral Reef', 'Bubble Chain'],
    dunes:   ['Sand Veil', 'Scarab March', 'Mirage Hunt', 'Glyph Trial', 'Sun Forge'],
    voidline:['Rift Walk', 'Sigil Burn', 'Eclipse Gate', 'Singularity', 'Void Storm'],
    apex:    ['Covenant', 'Halo Judgement', 'Ascension', 'Final Light', 'Apex Trial'],
  };
  const titlePool = titles[biome.id] ?? ['Level'];
  const title = isBoss ? `BOSS: ${titlePool[biome.act - 1] ?? 'Trial'}`
    : isActFinal ? `FINAL: ${biome.name}`
    : titlePool[level % titlePool.length];

  return { level, biome, board, diff, isBoss, isActFinal, isMystery, rarity, reward, goal, moves, targetType, title, phase };
}
