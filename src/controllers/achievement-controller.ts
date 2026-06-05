import { Response } from "express";
import Achievement from "../models/Achievement";
import { AuthRequest } from "../types/express";
import { achievementRules } from "../lib/engine/achievementEngine";
import { logActivity } from "../lib/activity";

export const getAchievements = async (req: AuthRequest, res: Response) => {
  try {
    const db = await Achievement.find({ userId: req.userId });

    const enriched = db.map((a) => {
      const rule = achievementRules.find((r) => r.key === a.key);

      return {
        ...a.toObject(),
        title: rule?.title,
        description: rule?.description,
        xpReward: rule?.xpReward,
        level: a.level,
      };
    });

    if (enriched.length > 0) {
      await logActivity({
        userId: req.userId,
        type: "achievement_unlocked",
        title: "Achievement Unlocked",
        description: enriched[0].description,
        severity: "success",
      });
    }

    return res.json(enriched);
  } catch (err) {
    return res.status(500).json({ message: "Failed to fetch achievements" });
  }
};