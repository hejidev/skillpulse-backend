import { Response } from "express";
import Skill from "../models/Skill";
import Progress from "../models/Progress";
import { AuthRequest } from "../types/express";

export const globalSearch = async (req: AuthRequest, res: Response) => {
  try {
    const q = (req.query.q as string)?.trim();

    if (!q) {
      return res.json({ skills: [], progress: [] });
    }

    const regex = new RegExp(q, "i");

    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const skills = await Skill.find({
      userId,
      name: regex,
    }).limit(10);

    const progress = await Progress.find({
      userId,
      note: regex, // change if your field is different
    }).limit(10);

    return res.json({ skills, progress });

  } catch (err) {
    console.error("SEARCH ERROR:", err);
    return res.status(500).json({ message: "Search failed" });
  }
};