import express from "express";
import {
  addProgress,
  getAllProgress,
  getIntelligence,
  getProgressBySkill,
  getSkillSessions,
} from "../controllers/progress-controller";
import { isAuth } from "../middleware/auth-middleware";

const router = express.Router();

router.post("/", isAuth, addProgress);
router.get("/skill/:skillId", isAuth, getProgressBySkill);
router.get("/", isAuth, getAllProgress);
router.get("/sessions/:skillId", isAuth, getSkillSessions);
router.get("/intelligence/:skillId", isAuth, getIntelligence);

export default router;