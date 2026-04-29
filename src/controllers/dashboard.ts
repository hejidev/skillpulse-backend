// controllers/dashboard.ts
import { NextFunction, Request, Response } from "express";
import Progress from "../models/Progress";

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