// routes/admin-referral-routes.ts
import express from "express";
import { isAuth, adminOnly } from "../middleware/auth-middleware";
import {
  getReferralConfig,
  updateReferralConfig,
  getReferralStats,
  backfillReferralCodes,
} from "../controllers/admin-referral-controller";

const router = express.Router();

router.get("/referrals/config", isAuth, adminOnly, getReferralConfig);
router.put("/referrals/config", isAuth, adminOnly, updateReferralConfig);
router.get("/referrals/stats", isAuth, adminOnly, getReferralStats);
router.post("/referrals/backfill-codes", isAuth, adminOnly, backfillReferralCodes);

export default router;