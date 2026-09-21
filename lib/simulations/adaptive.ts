export type DifficultyMode = "adaptive" | "beginner" | "intermediate" | "advanced" | "board";

export type DifficultyProfile = {
  easy: number;
  medium: number;
  hard: number;
};

export function profileForMode(
  mode: DifficultyMode,
  completedSimulations: number,
  averageAccuracy: number
): { level: string; profile: DifficultyProfile } {
  if (mode === "beginner") {
    return { level: "iniciante", profile: { easy: 50, medium: 40, hard: 10 } };
  }

  if (mode === "intermediate") {
    return { level: "intermediário", profile: { easy: 25, medium: 50, hard: 25 } };
  }

  if (mode === "advanced") {
    return { level: "avançado", profile: { easy: 10, medium: 40, hard: 50 } };
  }

  if (mode === "board") {
    return { level: "nível banca", profile: { easy: 5, medium: 35, hard: 60 } };
  }

  const progression = completedSimulations + (averageAccuracy >= 80 ? 2 : averageAccuracy >= 65 ? 1 : 0);

  if (progression <= 1) {
    return { level: "adaptativo inicial", profile: { easy: 40, medium: 40, hard: 20 } };
  }

  if (progression <= 3) {
    return { level: "adaptativo intermediário", profile: { easy: 25, medium: 50, hard: 25 } };
  }

  if (progression <= 5) {
    return { level: "adaptativo avançado", profile: { easy: 15, medium: 45, hard: 40 } };
  }

  return { level: "adaptativo banca", profile: { easy: 10, medium: 30, hard: 60 } };
}

export function difficultySchedule(count: number, profile: DifficultyProfile) {
  const easyCount = Math.round((count * profile.easy) / 100);
  const hardCount = Math.round((count * profile.hard) / 100);
  const mediumCount = Math.max(0, count - easyCount - hardCount);

  const values = [
    ...Array.from({ length: easyCount }, () => "fácil"),
    ...Array.from({ length: mediumCount }, () => "média"),
    ...Array.from({ length: hardCount }, () => "difícil"),
  ];

  return values.sort((a, b) => {
    const rank: Record<string, number> = { "fácil": 1, "média": 2, "difícil": 3 };
    return rank[a] - rank[b];
  });
}
