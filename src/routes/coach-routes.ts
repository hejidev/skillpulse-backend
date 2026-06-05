import express from "express";
import { isAuth } from "../middleware/auth-middleware";
import { getCoachInsight } from "../controllers/coach-controller";
import { getCoachDashboard } from "../controllers/dashboard";

const router = express.Router();

router.post("/", isAuth, getCoachInsight);
router.get("/dashboard", isAuth, getCoachDashboard);

console.log("✅ Coach routes loaded");

export default router;