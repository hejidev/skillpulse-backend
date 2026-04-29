// controllers/progress-controller.ts
import { Response } from "express";
import Progress from "../models/Progress";
import Skill from "../models/Skill";
import User from "../models/User"; // ✅ FIXED IMPORT
import { AuthRequest } from "../types/express";
import { io } from "../server";
import { XP_PER_HOUR } from "../utils/gamification";

// ===============================
// 🧠 STREAK HELPERS
// ===============================

export const getMissedDays = (lastDate?: Date) => {
  if (!lastDate) return 999;

  const today = new Date().setHours(0, 0, 0, 0);
  const last = new Date(lastDate).setHours(0, 0, 0, 0);

  return Math.floor((today - last) / (1000 * 60 * 60 * 24));
};

export const canUseFreeze = (user: any, missedDays: number) => {
  return user.streak.freezeCount > 0 && missedDays === 1;
};

export const applyFreeze = (user: any) => {
  user.streak.freezeCount = Math.max(0, user.streak.freezeCount - 1);
};

// ===============================
// 🔥 STREAK ENGINE (FINAL)
// ===============================
export const updateStreak = (user: any) => {
  const missedDays = getMissedDays(user.streak.lastActiveDate);

  const today = new Date().setHours(0, 0, 0, 0);
  const last = user.streak.lastActiveDate
    ? new Date(user.streak.lastActiveDate).setHours(0, 0, 0, 0)
    : null;

  // ✅ already updated today → STOP
  if (last === today) return user;

  // 🟢 ACTIVE CONTINUATION
  if (missedDays === 0 || missedDays === 1) {
    user.streak.current += 1;
  }

  // 🧊 MISSED 2 DAYS → FREEZE CHECK
  else if (missedDays === 2) {
    if (user.streak.freezeCount > 0) {
      applyFreeze(user);
    } else {
      user.streak.current = 0;
    }
  }

  // 🔴 MISSED 3+ DAYS → RESET
  else if (missedDays > 2) {
    user.streak.current = 0;
  }

  // 🏆 update longest streak
  user.streak.longest = Math.max(
    user.streak.longest,
    user.streak.current
  );

  // 📅 update last active ONLY on real action
  user.streak.lastActiveDate = new Date();

  return user;
};

// ===============================
// 🚀 ADD PROGRESS
// ===============================
export const addProgress = async (req: AuthRequest, res: Response) => {
  try {
    const { skillId, hours, note } = req.body;

    const skill = await Skill.findOne({
      _id: skillId,
      userId: req.userId,
    });

    if (!skill) {
      return res.status(404).json({ message: "Skill not found" });
    }

    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // 🔥 UPDATE STREAK FIRST
    updateStreak(user);
    await user.save();

    // ⚡ XP CALC
    const xp = Number(hours) * XP_PER_HOUR;

    // 📦 CREATE PROGRESS
    const progress = await Progress.create({
      userId: req.userId,
      skillId,
      hours: Number(hours),
      xp,
      note,
    });

    // 🔥 UPDATE SKILL
    skill.xp = (skill.xp || 0) + xp;
    skill.totalHours = (skill.totalHours || 0) + Number(hours);

    await skill.save();

    // 📡 REALTIME UPDATE
    io.emit("new-progress", progress);

    return res.status(201).json(progress);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Failed to add progress" });
  }
};

// ===============================
// 📥 GET PROGRESS BY SKILL
// ===============================
export const getProgressBySkill = async (req: AuthRequest, res: Response) => {
  try {
    const { skillId } = req.params;

    const progress = await Progress.find({
      userId: req.userId,
      skillId,
    }).sort({ createdAt: 1 });

    res.json(progress);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch progress" });
  }
};

// ===============================
// 📥 GET ALL PROGRESS
// ===============================
export const getAllProgress = async (req: AuthRequest, res: Response) => {
  try {
    const progress = await Progress.find({
      userId: req.userId,
    })
      .populate("skillId", "name")
      .sort({ createdAt: -1 });

    const formatted = progress.map((p: any) => ({
      _id: p._id,
      hours: p.hours,
      xp: p.xp,
      createdAt: p.createdAt,
      skillName: p.skillId?.name || "Unknown",
    }));

    return res.json(formatted);
  } catch (err) {
    return res.status(500).json({
      message: "Failed to fetch progress",
    });
  }
};