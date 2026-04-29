export function generateCoachMessage(data: any) {
  const { bestDay, worstDay, consistencyScore } = data;

  if (consistencyScore < 40) {
    return `⚠️ You're inconsistent. Try studying daily, starting with ${bestDay}.`;
  }

  if (consistencyScore > 70) {
    return `🔥 Strong consistency. Double down on ${bestDay}.`;
  }

  if (bestDay && worstDay) {
    return `📊 You perform best on ${bestDay}, but weak on ${worstDay}. Balance it.`;
  }

  return "🚀 Keep pushing forward.";
}