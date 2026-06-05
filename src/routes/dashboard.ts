import express from "express";
import { isAuth } from "../middleware/auth-middleware";
import { getCoachDashboard, getWeeklyProgress } from "../controllers/dashboard";

const router = express.Router();

router.get("/dashboard", isAuth, getCoachDashboard);
router.get("/weekly", isAuth, getWeeklyProgress);

export default router;