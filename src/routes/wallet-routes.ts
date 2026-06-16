import express from "express";
import { isAuth } from "../middleware/auth-middleware";
import { redeemPointsForPremium } from "../controllers/wallet-controller";

const router = express.Router();

router.post("/wallet/redeem/premium", isAuth, redeemPointsForPremium);

export default router;