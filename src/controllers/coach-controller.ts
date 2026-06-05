import { generateAICoach } from "../services/ai-service";
import { buildCoachContext } from "../services/coach-engine";

import Skill from "../models/Skill";
import Progress from "../models/Progress";

export const getCoachInsight = async (req: any, res: any) => {
  try {
    const { skillId } = req.body;

    // ================= VALIDATION =================
    if (!skillId) {
      return res.status(400).json({
        text: "Skill ID is required",
        mood: "neutral",
      });
    }

    // ================= FETCH SKILL =================
    const skill = await Skill.findById(skillId);

    if (!skill) {
      return res.status(404).json({
        text: "Skill not found",
        mood: "neutral",
      });
    }

    // ================= FETCH PROGRESS =================
    const progress = await Progress.find({
      skillId,
    }).sort({
      createdAt: 1,
    });

    // ================= BUILD CONTEXT =================
    const context = buildCoachContext(
      skill,
      progress
    );

    // ================= EMPTY STATE =================
    if (!context) {
      return res.json({
        text: "🚀 Start tracking progress to unlock your AI coach.",
        mood: "neutral",
      });
    }

    // ================= AI ENGINE =================
    const result = await generateAICoach(
      context,
      req.userId,
      skillId
    );

    // ================= SAFETY FALLBACK =================
    if (
      !result ||
      typeof result !== "object" ||
      !result.text
    ) {
      return res.json({
        text: "⚡ Keep pushing. Momentum creates mastery.",
        mood: "motivational",
      });
    }

    // ================= SUCCESS =================
    return res.json({
      text: result.text,
      mood: result.mood || "neutral",
    });

  } catch (err: any) {
    console.error("❌ COACH ERROR:", err);

    return res.status(500).json({
      text: "AI coach temporarily unavailable",
      mood: "neutral",
    });
  }
};