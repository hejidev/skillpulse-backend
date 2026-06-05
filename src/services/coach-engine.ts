import { differenceInDays } from "date-fns";
import { calculateStreak } from "../utils/streak";

export function buildCoachContext(skill: any, progress: any[]) {
  if (!progress?.length) return null;

  const last7 = progress.slice(-7);

  const activeDays = last7.filter((p: any) => p.hours > 0).length;
  const consistencyScore = (activeDays / 7) * 100;

  const streak = calculateStreak(progress);

  const weeklyHours = last7.reduce(
    (acc: number, p: any) => acc + p.hours,
    0
  );

  const goalPercent =
    (skill.totalHours / skill.targetHours) * 100;

  const lastEntry = progress[progress.length - 1];

  const lastActiveDaysAgo = lastEntry
    ? differenceInDays(new Date(), new Date(lastEntry.createdAt))
    : 0;

  // 🔥 REAL BEST/WORST DAY LOGIC
  const dayMap: Record<string, number> = {};

  last7.forEach((p: any) => {
    const day = new Date(p.createdAt).toLocaleDateString("en-US", {
      weekday: "long",
    });

    dayMap[day] = (dayMap[day] || 0) + p.hours;
  });

  let bestDay = "None";
  let worstDay = "None";

  const entries = Object.entries(dayMap);

  if (entries.length) {
    bestDay = entries.reduce((a, b) =>
      a[1] > b[1] ? a : b
    )[0];

    worstDay = entries.reduce((a, b) =>
      a[1] < b[1] ? a : b
    )[0];
  }

  return {
    skillName: skill.name,
    streak,
    weeklyHours,
    lastActiveDaysAgo,
    goalPercent,
    consistencyScore,
    bestDay,
    worstDay,
  };
}