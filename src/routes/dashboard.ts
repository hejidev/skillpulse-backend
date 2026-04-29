import express from "express";
import { isAuth } from "../middleware/auth-middleware";
import { getWeeklyProgress } from "../controllers/dashboard";

const router = express.Router();

router.get("/weekly", isAuth, getWeeklyProgress);

export default router;