export const XP_WIN  = 50;
export const XP_LOSS = 15;
export const XP_TIE  = 25;

export const LEVELS: ReadonlyArray<{ minXp: number; title: string }> = [
  { minXp: 0,     title: 'Apprentice' },
  { minXp: 50,    title: 'Scholar' },
  { minXp: 150,   title: 'Practitioner' },
  { minXp: 300,   title: 'Analyst' },
  { minXp: 500,   title: 'Arithmetician' },
  { minXp: 750,   title: 'Tactician' },
  { minXp: 1050,  title: 'Strategist' },
  { minXp: 1400,  title: 'Expert' },
  { minXp: 1800,  title: 'Master' },
  { minXp: 2250,  title: 'Arithmancer' },
  { minXp: 2750,  title: 'Calculator' },
  { minXp: 3300,  title: 'Senior Arithmetician' },
  { minXp: 3900,  title: 'Senior Arithmancer' },
  { minXp: 4550,  title: 'Senior Wizard' },
  { minXp: 5250,  title: 'Prodigy' },
  { minXp: 6000,  title: 'Grand Tactician' },
  { minXp: 6800,  title: 'Grand Strategist' },
  { minXp: 7650,  title: 'Grand Expert' },
  { minXp: 8550,  title: 'Grand Master' },
  { minXp: 9500,  title: 'Grand Wizard' },
  { minXp: 10500, title: 'Grand Calculator' },
  { minXp: 11550, title: 'Grand Arithmetician' },
  { minXp: 12650, title: 'Grand Arithmancer' },
  { minXp: 13800, title: 'Elder Wizard' },
  { minXp: 15000, title: 'Grand Multiplier' },
] as const;

export function xpToLevel(xp: number): number {
  if (xp <= 0) return 1;
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (xp >= LEVELS[i].minXp) return i + 1;
  }
  return 1;
}

export function levelToTitle(level: number): string {
  return (LEVELS[level - 1] ?? LEVELS[LEVELS.length - 1]).title;
}

export function xpProgress(xp: number): { current: number; needed: number } {
  const level = xpToLevel(xp);
  const currentMin = LEVELS[level - 1]?.minXp ?? 0;
  const nextMin    = LEVELS[level]?.minXp;
  return {
    current: xp - currentMin,
    needed: nextMin !== undefined ? nextMin - currentMin : 0,
  };
}
