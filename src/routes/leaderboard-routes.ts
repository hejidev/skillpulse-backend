// routes/leaderboard-routes.ts

import express from "express";
import { getLeaderboard } from "../controllers/leaderboard-controller";
import { isAuth } from "../middleware/auth-middleware";

const router = express.Router();

router.get("/", isAuth, getLeaderboard);

export default router;