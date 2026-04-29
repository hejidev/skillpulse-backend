import { Response } from "express";
import Skill from "../models/Skill";
import { AuthRequest } from "../types/express";
import { createSkillSchema } from "../validators/skills";

// CREATE
export const createSkill = async (req: AuthRequest, res: Response) => {
  try {
    // 🔥 VALIDATION HERE
    const parsed = createSkillSchema.partial().safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json(parsed.error);
    }

    const { name, level } = parsed.data;

    const skill = await Skill.create({
      userId: req.userId,
      name,
      level,
    });

    res.status(201).json(skill);
  } catch (err) {
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