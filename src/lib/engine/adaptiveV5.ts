import { behaviorEngine } from "./behaviorEngine";

export function adaptiveV5(sessions: any[]) {
  const behavior = behaviorEngine(sessions);

  const base =
    behavior.state === "HIGH_PERFORMANCE"
      ? 3.5
      : behavior.state === "UNSTABLE"
      ? 1
      : behavior.state === "UNDERPERFORMING"
      ? 1.5
      : 2;

  const hourScore: Record<number, number> = {};

  sessions.forEach((s) => {
    const h = new Date(s.start).getHours();
    const weight = (s.focusScore || 50) / 50;
    hourScore[h] = (hourScore[h] || 0) + weight;
  });

  const bestHour =
    Object.entries(hourScore)
      .sort((a, b) => b[1] - a[1])[0]?.[0] ?? 10;

  const adaptiveGoal =
    Math.min(6, Math.max(1, sessions.length * 0.4 + base));

  return {
    suggestedHoursToday: Number(base.toFixed(1)),
    suggestedTime: Number(bestHour),
    adaptiveGoal: Number(adaptiveGoal.toFixed(1)),
    state: behavior.state,
    signals: behavior.signals,
  };
}