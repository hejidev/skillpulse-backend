import express from "express";
import { getAchievements } from "../controllers/achievement-controller";
import { isAuth } from "../middleware/auth-middleware";

const router = express.Router();

router.get("/", isAuth, getAchievements);

export default router;