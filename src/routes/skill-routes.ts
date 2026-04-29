import express from "express";
import {
  createSkill,
  getSkills,
  updateSkill,
  deleteSkill,
  getSkillById
} from "../controllers/skill-controller";
import { isAuth } from "../middleware/auth-middleware";

const router = express.Router();

router.post("/", isAuth, createSkill);
router.get("/", isAuth, getSkills);
router.get("/:id", isAuth, getSkillById);

// NEW
router.put("/:id", isAuth, updateSkill);
router.delete("/:id", isAuth, deleteSkill);

export default router;