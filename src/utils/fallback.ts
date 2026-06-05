export function generateCoachMessage(data: any) {
  const { bestDay, worstDay, consistencyScore, streak } = data;

  // 🔥 LOW PERFORMANCE MODE (STRICT COACH)
  if (consistencyScore < 40) {
    return {
      text: `⚠️ You're slipping. No excuses. Train on ${bestDay}.`,
      mood: "strict",
    };
  }

  // ⚡ AVERAGE MODE (DIRECT COACH)
  if (consistencyScore >= 40 && consistencyScore <= 70) {
    return {
      text: `📊 You're improving, but ${worstDay} is holding you back.`,
      mood: "focused",
    };
  }

  // 🔥 HIGH PERFORMANCE MODE (MOTIVATION)
  if (consistencyScore > 70) {
    return {
      text: `🔥 Elite consistency. Dominate ${bestDay} even harder.`,
      mood: "motivational",
    };
  }

  return {
    text: "🚀 Keep pushing forward.",
    mood: "neutral",
  };
}