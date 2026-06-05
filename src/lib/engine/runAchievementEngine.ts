import Achievement from "../../models/Achievement";
import User from "../../models/User";
import { achievementRules } from "./achievementEngine";

export function getLevel(progress: number) {
  if (progress >= 100) return "legendary";
  if (progress >= 75) return "gold";
  if (progress >= 40) return "silver";
  return "bronze";
}

export async function runAchievementEngine({
  userId,
  sessions,
  streak,
  totalXP,
  io,
}: any) {
  if (!userId) return;

  for (const rule of achievementRules) {
    const progress = Math.round(
      rule.progress({ sessions, streak, totalXP })
    );

    const isUnlocked = rule.check({ sessions, streak, totalXP });

    const level = getLevel(progress);

    const achievement = await Achievement.findOneAndUpdate(
      { userId, key: rule.key },
      {
        $setOnInsert: {
          title: rule.title,
          description: rule.description,
          xpReward: rule.xpReward,
        },
        progress,
        level,
        unlocked: isUnlocked,
        ...(isUnlocked ? { unlockedAt: new Date() } : {}),
      },
      { upsert: true, new: true }
    );

    if (isUnlocked) {
      io.to(userId).emit("achievement-unlocked", achievement);
    }
  }
}