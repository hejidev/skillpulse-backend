// routes/referral-routes.ts
import express from "express";
import { isAuth } from "../middleware/auth-middleware";
import { getMyReferralOverview } from "../controllers/referral-controller";

const router = express.Router();

router.get("/me", isAuth, getMyReferralOverview);

export default router;