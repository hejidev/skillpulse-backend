// controllers/dashboard.ts
import { NextFunction, Request, Response } from "express";

import { buildCoachContext } from "../services/coach-engine";
import { calculateStreak } from "../utils/streak";

import Progress from "../models/Progress";
import Skill from "../models/Skill";

// ====== COACH DASHBOARD CONTROLLER ======
export const getCoachDashboard = async (req: any, res: any) => {
  try {
    const userId = req.userId;

    // 🔥 fetch all user skills + progress
    const skills = await Skill.find({ userId });

    const enriched = await Promise.all(
      skills.map(async (skill) => {
        const progress = await Progress.find({ skillId: skill._id });

        const context = buildCoachContext(skill, progress);

        const streak = calculateStreak(progress);

        return {
          skill,
          context,
          streak,
          progress,
        };
      })
    );

    const totalHours = enriched.reduce(
      (acc, s) =>
        acc +
        (s.context?.weeklyHours || 0),
      0
    );

    const avgConsistency =
      enriched.reduce(
        (acc, s) =>
          acc + (s.context?.consistencyScore || 0),
        0
      ) / (enriched.length || 1);

    res.json({
      totalSkills: skills.length,
      totalHours,
      avgConsistency,
      skills: enriched,
    });
  } catch (err) {
    res.status(500).json({ message: "Coach dashboard failed" });
  }
};

export const getWeeklyProgress = async (req: Request & { userId?: string }, res: Response) => {
  try {
    const data = await Progress.aggregate([
      {
        $match: { userId: req.userId },
      },
      {
        $group: {
          _id: {
            week: { $week: "$createdAt" },
            year: { $year: "$createdAt" },
          },
          totalHours: { $sum: "$hours" },
        },
      },
      {
        $sort: { "_id.year": 1, "_id.week": 1 },
      },
    ]);

    res.json(data);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch analytics" });
  }
};