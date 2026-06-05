import { Response } from "express";
import Skill from "../models/Skill";
import { AuthRequest } from "../types/express";
import { io } from "../server";
import User from "../models/User";
import { logActivity } from "../lib/activity";
import { buildSkillPopularity } from "../lib/intelligence/skill-popularity-engine";

// CREATE
export const createSkill = async (req: AuthRequest, res: Response) => {
  try {
    const { name, level } = req.body;

    const skill = await Skill.create({
      userId: req.userId,
      name,
      level,
    });


// rebuild analytics
const updatedSkills = await buildSkillPopularity();

// emit realtime update
io.to("admin-dashboard").emit(
  "intelligence:skills",
  updatedSkills
);

    // ✅ GET USER
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // ✅ CREATE NOTIFICATION OBJECT
    const notification = {
      message: `🚀 New skill "${name}" created`,
      type: "success" as const,
      read: false,
      archived: false,
      createdAt: new Date(),
    };

    await logActivity({
  userId: req.userId,
  type: "skill_created",
  title: "New Skill Created",
  description: `${user.name} created ${name}`,
  severity: "success",

  metadata: {
    skillId: skill._id,
    skill: skill.name,
    level: skill.level,
  },
});

    // ✅ SAVE TO DB
    user.notifications.unshift(notification);
    await user.save();

    // ✅ REAL-TIME PUSH
    io.to(req.userId!).emit("notification", notification);

    // 🚀 ADD THIS (CRITICAL)
    io.to(req.userId!).emit("skill-created", skill);

    res.status(201).json(skill);

  } catch (err: any) {
    // ✅ HANDLE DUPLICATE SKILL
    if (err.code === 11000) {
      return res.status(400).json({
        message: "Skill already exists",
      });
    }

    res.status(500).json({ message: "Failed to create skill" });
  }
};

// GET
export const getSkills = async (req: AuthRequest, res: Response) => {
  try {
    const skills = await Skill.find({ userId: req.userId }).sort({
      createdAt: -1,
    });

    res.json(skills);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch skills" });
  }
};

// UPDATE ✨
export const updateSkill = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const skill = await Skill.findOne({
      _id: id,
      userId: req.userId,
    });

    if (!skill) {
      return res.status(404).json({ message: "Skill not found" });
    }

    skill.name = req.body.name ?? skill.name;
    skill.level = req.body.level ?? skill.level;

    await skill.save();

    res.json(skill);
  } catch (err) {
    res.status(500).json({ message: "Failed to update skill" });
  }
};

// DELETE ✨
export const deleteSkill = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const skill = await Skill.findOneAndDelete({
      _id: id,
      userId: req.userId,
    });

    if (!skill) {
      return res.status(404).json({ message: "Skill not found" });
    }

    res.json({ message: "Skill deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Failed to delete skill" });
  }
};

export const getSkillById = async (req: AuthRequest, res: Response) => {
  try {
    const skill = await Skill.findOne({
      _id: req.params.id,
      userId: req.userId,
    });

    if (!skill) {
      return res.status(404).json({ message: "Skill not found" });
    }

    res.json(skill);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch skill" });
  }
};