export interface PlayerProgress {
  currentLevel: number;
  wallet: string;
}

export async function getPlayerProgress(wallet: string): Promise<PlayerProgress> {
  try {
    const stored = typeof window !== 'undefined' ? parseInt(localStorage.getItem('bb_max_level') ?? '1') : 1;
    const currentLevel = isNaN(stored) || stored < 1 ? 1 : stored;
    return { currentLevel, wallet };
  } catch {
    return { currentLevel: 1, wallet };
  }
}
