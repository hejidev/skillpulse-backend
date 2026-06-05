import { Request, Response } from "express";

import Activity from "../models/Activity";
import User from "../models/User";
import Progress from "../models/Progress";
import Skill from "../models/Skill";
import Ticket from "../models/Ticket";

export const getActivityDashboard = async (req: Request, res: Response) => {
  try {
    const [
      totalUsers,
      onlineUsers,
      totalSkills,
      totalProgressLogs,
      totalTickets,
      recentActivities,
    ] = await Promise.all([
      User.countDocuments(),

      User.countDocuments({ isOnline: true }),

      Skill.countDocuments(),

      Progress.countDocuments(),

      Ticket.countDocuments(),

      Activity.find()
        .sort({ createdAt: -1 })
        .limit(30)
        .populate("userId", "name email avatar")
        .lean(), // 🔥 IMPORTANT FIX
    ]);

    const dailyActivity = await Activity.aggregate([
      {
        $group: {
          _id: {
            day: { $dayOfMonth: "$createdAt" },
            month: { $month: "$createdAt" },
          },
          total: { $sum: 1 },
        },
      },
      {
        $sort: { "_id.month": 1, "_id.day": 1 },
      },
    ]);

    const topUsers = await Progress.aggregate([
      {
        $group: {
          _id: "$userId",
          totalXP: { $sum: "$xp" },
          totalHours: { $sum: "$hours" },
        },
      },
      { $sort: { totalXP: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "user",
        },
      },
      { $unwind: "$user" },
    ]);

    return res.json({
      stats: {
        totalUsers,
        onlineUsers,
        totalSkills,
        totalProgressLogs,
        totalTickets,
      },
      recentActivities,
      dailyActivity,
      topUsers,
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({
      message: "Failed to load activity dashboard",
    });
  }
};

export const getActivityFeed =
  async (req: Request, res: Response) => {

    const activities =
      await Activity.find()
        .sort({ createdAt: -1 })
        .limit(50)
        .populate(
          "userId",
          "name email avatar"
        );

    res.json({
      success: true,
      activities,
    });
  };