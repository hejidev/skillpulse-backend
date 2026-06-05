// lib/engine/achievementEvolution.ts

export function getLevel(progress: number) {
  if (progress >= 100) return "legendary";
  if (progress >= 70) return "gold";
  if (progress >= 40) return "silver";
  return "bronze";
}