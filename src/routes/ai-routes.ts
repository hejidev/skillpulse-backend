import express from "express";
import { generateAICoach } from "../services/ai-service";
import { isAuth } from "../middleware/auth-middleware";

declare global {
  namespace Express {
    interface Request {
      userId?: string;
    }
  }
}

const router = express.Router();

router.post("/coach", isAuth, async (req, res) => {
  try {
    const message = await generateAICoach(
      req.body,
      req.userId!,
      req.body.skillId // 👈 IMPORTANT
    );

    res.json({ message });
  } catch (err) {
    res.status(500).json({ message: "AI failed" });
  }
});

export default router;