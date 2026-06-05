export function behaviorEngine(sessions: any[]) {
  if (!sessions?.length) {
    return {
      state: "NO_DATA",
      score: 0,
      risk: "low",
      signals: ["Initialize system with first session"],
    };
  }

  const valid = sessions.filter((s) => s?.start);

  const totalHours = valid.reduce((a, s) => a + (s.totalHours || 0), 0);
  const avgHours = totalHours / valid.length;

  const focus = valid.map((s) => s.focusScore || 50);
  const avgFocus = focus.reduce((a, b) => a + b, 0) / focus.length;

  const instability =
    Math.sqrt(
      focus.reduce((a, f) => a + Math.pow(f - avgFocus, 2), 0) / focus.length
    );

  let state = "STABLE";
  let risk: "low" | "medium" | "high" = "low";

  const signals: string[] = [];

  if (avgHours < 1) {
    state = "UNDERPERFORMING";
    risk = "medium";
    signals.push("Low session duration detected");
  }

  if (avgFocus < 45) {
    risk = "medium";
    signals.push("Focus quality below threshold");
  }

  if (instability > 25) {
    state = "UNSTABLE";
    risk = "high";
    signals.push("Performance instability detected");
  }

  if (avgHours > 2 && avgFocus > 70 && instability < 20) {
    state = "HIGH_PERFORMANCE";
    risk = "low";
    signals.push("Elite performance pattern detected");
  }

  return {
    state,
    risk,
    score: Math.round(avgFocus),
    avgHours,
    instability: Number(instability.toFixed(1)),
    signals,
  };
}