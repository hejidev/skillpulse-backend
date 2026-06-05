// controllers/progress-controller.ts
import { Response } from "express";
import Progress from "../models/Progress";
import Skill from "../models/Skill";
import User from "../models/User";
import { AuthRequest } from "../types/express";
import { io } from "../server";
import { XP_PER_HOUR } from "../utils/gamification";
import { buildSessions } from "../utils/buildSessions";
import { autonomousTrigger } from "../lib/engine/autonomousTrigger";
import { behaviorEngine } from "../lib/engine/behaviorEngine";
import { adaptiveV5 } from "../lib/engine/adaptiveV5";
import { runAchievementEngine } from "../lib/engine/runAchievementEngine";
import { logActivity } from "../lib/activity";

// ===============================
// 🧠 STREAK HELPERS (FIXED)
// ===============================
const normalizeDate = (date: Date) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
};

const getMissedDays = (lastDate?: Date) => {
  if (!lastDate) return 999;

  const today = normalizeDate(new Date());
  const last = normalizeDate(new Date(lastDate));

  return Math.floor((today - last) / (1000 * 60 * 60 * 24));
};

const applyFreeze = (user: any) => {
  user.streak.freezeCount = Math.max(0, user.streak.freezeCount - 1);
};

// ===============================
// 🔥 STREAK ENGINE (FIXED)
// ===============================
const updateStreak = (user: any) => {
  const today = normalizeDate(new Date());
  const last = user.streak.lastActiveDate
    ? normalizeDate(new Date(user.streak.lastActiveDate))
    : null;

  const missedDays = getMissedDays(user.streak.lastActiveDate);

  if (last !== null && last === today) {
    return user;
  }

  if (missedDays === 1) {
    user.streak.current += 1;
  } else if (missedDays === 999) {
    user.streak.current = 1;
  } else if (missedDays === 2) {
    if (user.streak.freezeCount > 0) {
      applyFreeze(user);
    } else {
      user.streak.current = 1;
    }
  } else if (missedDays > 2) {
    user.streak.current = 1;
  }

  user.streak.longest = Math.max(
    user.streak.longest,
    user.streak.current
  );

  user.streak.lastActiveDate = new Date();

  return user;
};

// ===============================
// 🚀 ADD PROGRESS (FIXED)
// ===============================
export const addProgress = async (req: AuthRequest, res: Response) => {
  try {
    const { skillId, hours, note } = req.body;

    if (!req.userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const userId = req.userId;

    // =====================
    // VALIDATE SKILL
    // =====================
    const skill = await Skill.findOne({ _id: skillId, userId });
    if (!skill) {
      return res.status(404).json({ message: "Skill not found" });
    }

    // =====================
    // USER
    // =====================
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // =====================
    // STREAK
    // =====================
    updateStreak(user);
    await user.save();

    // =====================
    // XP
    // =====================
    const safeHours = Number(hours) || 0;
    const xp = safeHours * XP_PER_HOUR;

    // =====================
    // CREATE PROGRESS
    // =====================
    const progress = await Progress.create({
      userId,
      skillId,
      hours: safeHours,
      xp,
      note,
    });

    // =====================
    // UPDATE SKILL
    // =====================
    // =====================
    // UPDATE SKILL (SMART SCALING 🚀)
    // =====================

    // base updates
    skill.xp = (skill.xp || 0) + xp;
    skill.totalHours = (skill.totalHours || 0) + safeHours;

    // =====================
    // 🧠 SMART DIFFICULTY SYSTEM
    // =====================

    // 1️⃣ LEVEL MULTIPLIER (difficulty scaling)
    const levelMultiplierMap: Record<string, number> = {
      Beginner: 1.2,
      Intermediate: 1.0,
      Advanced: 0.7,
    };

    const levelMultiplier =
      levelMultiplierMap[skill.level as string] || 1;

    // 2️⃣ INTENSITY (effort boost)
    const intensityFactor = Math.min(
      1.5,
      1 + safeHours * 0.2
    );

    // 3️⃣ STREAK BONUS (consistency reward)
    const streakBonus = 1 + Math.min(
      (user.streak.current || 0) * 0.02,
      0.3
    );

    // 4️⃣ DIMINISHING RETURNS (anti-spam)
    const diminishingFactor =
      1 / (1 + safeHours * 0.1);

    // 5️⃣ BASE PROGRESS (relative to target)
    const baseProgress =
      safeHours / (skill.targetHours || 50);

    // 6️⃣ FINAL SMART GAIN
    const smartProgressGain =
      baseProgress *
      levelMultiplier *
      intensityFactor *
      streakBonus *
      diminishingFactor;

    // 7️⃣ APPLY PROGRESS
    skill.progress = Math.min(
      100,
      Math.round(
        (skill.progress || 0) +
        smartProgressGain * 100
      )
    );

    // =====================
    // 🎯 OPTIONAL: AUTO LEVEL UP
    // =====================
    if (skill.progress >= 100) {
      if (skill.level === "Beginner") {
        skill.level = "Intermediate";
      } else if (skill.level === "Intermediate") {
        skill.level = "Advanced";
      }

      skill.progress = 0; // reset for next tier
    }

    // =====================
    // 📊 OPTIONAL: LOG PROGRESS HISTORY
    // =====================
    skill.progressLogs.push({
      hours: safeHours,
      createdAt: new Date(),
    });

    await skill.save();

    // =====================
    // BUILD SESSIONS (SAFE)
    // =====================
    const logs = await Progress.find({ userId, skillId }).sort({ createdAt: 1 });

    const sessions = buildSessions(logs).map((session: any[]) => {
      if (!session.length) return null;

      const totalHours = session.reduce(
        (acc, s) => acc + (s.hours || 0),
        0
      );

      const xp = session.reduce((acc, s) => acc + (s.xp || 0), 0);

      const start = new Date(session[0]?.createdAt);
      const end = new Date(session[session.length - 1]?.createdAt);

      const duration =
        (end.getTime() - start.getTime()) / (1000 * 60) || 0;

      const focusScore =
        totalHours * 10 + xp * 0.5 + duration * 0.2;

      return {
        start,
        end,
        duration,
        totalHours,
        xp,
        focusScore,
      };
    }).filter(Boolean);

    // =====================
    // 🧠 SAFE ENGINE EXECUTION
    // =====================
    try {
      await runAchievementEngine({
        userId,
        sessions,
        streak: user.streak.current,
        totalXP: (user as any).xp || 0,
        io,
      });
    } catch (err) {
      console.error("Achievement Engine Error:", err);
    }

    try {
      await autonomousTrigger({ sessions, userId, io });
    } catch (err) {
      console.error("Autonomous Engine Error:", err);
    }

    await logActivity({
  userId: req.userId,

  type: "progress_added",

  title: "Progress Logged",

  description: `${hours} hours logged`,

  severity: "info",

  metadata: {
    skillId,
    xp,
    hours,
  },
});

    // =====================
    // SOCKET
    // =====================
    io.to(userId).emit("new-progress", {
      progress,
      streak: user.streak.current,
      freezeCount: user.streak.freezeCount, // ✅ ADD THIS
    });

    // ✅ SUCCESS RESPONSE
    return res.status(201).json({
      progress,
      streak: user.streak.current,
      freezeCount: user.streak.freezeCount, // ✅ ADD THIS
    });

  } catch (err) {
    console.error("ADD PROGRESS ERROR:", err);
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

    const user = await User.findById(req.userId);

    return res.json({
      progress: formatted,
      streak: user?.streak?.current || 0,
      freezeCount: user?.streak?.freezeCount || 0, // ✅ ADD THIS
    });
  } catch (err) {
    return res.status(500).json({
      message: "Failed to fetch progress",
    });
  }
};

// ===============================
// 📊 GET SESSIONS BY SKILL
// ===============================
export const getSkillSessions = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const { skillId } = req.params;

    const logs = await Progress.find({
      userId: req.userId,
      skillId,
    }).sort({ createdAt: 1 });

    const sessions = buildSessions(logs);

    const enriched = sessions.map((session) => {
      const totalHours = session.reduce(
        (acc: number, s: any) => acc + (s.hours || 0),
        0
      );

      const xp = session.reduce(
        (acc: number, s: any) => acc + (s.xp || 0),
        0
      );

      // 🕒 DURATION (minutes)
      const start = new Date(session[0].createdAt);
      const end = new Date(session[session.length - 1].createdAt);

      const duration =
        (end.getTime() - start.getTime()) / (1000 * 60);

      // ⚡ FOCUS SCORE (SMART)
      const focusScore =
        totalHours * 10 + xp * 0.5 + duration * 0.2;

      // 🔥 INTENSITY
      const intensity =
        totalHours >= 2
          ? "Deep Work 🔥"
          : totalHours >= 1
            ? "Focused ⚡"
            : "Light 🧠";

      return {
        start,
        end,
        duration,
        totalHours,
        xp,
        focusScore,
        intensity,
        logs: session,
      };
    });

    return res.json(enriched);
  } catch (err) {
    return res.status(500).json({
      message: "Failed to build sessions",
    });
  }
};

export const getIntelligence = async (req: AuthRequest, res: Response) => {
  const { skillId } = req.params;

  const sessions = await Progress.find({
    userId: req.userId,
    skillId,
  });

  const behavior = behaviorEngine(sessions);
  const adaptive = adaptiveV5(sessions);

  res.json({
    behavior,
    adaptive,
  });
};
