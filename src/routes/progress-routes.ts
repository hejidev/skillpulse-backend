import express from "express";
import {
  addProgress,
  getAllProgress,
  getProgressBySkill,
} from "../controllers/progress-controller";
import { isAuth } from "../middleware/auth-middleware";

const router = express.Router();

router.post("/", isAuth, addProgress);
router.get("/:skillId", isAuth, getProgressBySkill);
router.get("/", isAuth, getAllProgress); // ✅ ADD THIS

export default router;