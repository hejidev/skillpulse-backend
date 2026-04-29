import { Response } from "express";
import Progress from "../models/Progress";
import { AuthRequest } from "../types/express";

export const getLeaderboard = async (req: AuthRequest, res: Response) => {
  try {
    const leaderboard = await Progress.aggregate([
      {
        $group: {
          _id: "$userId",
          totalXP: { $sum: "$xp" },
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "user",
        },
      },
      { $unwind: "$user" },
      {
        $project: {
          userId: "$_id",
          name: "$user.name",
          totalXP: 1,
        },
      },
      { $sort: { totalXP: -1 } },
    ]);

    return res.json(leaderboard);
  } catch (err) {
    return res.status(500).json({ message: "Failed leaderboard" });
  }
};