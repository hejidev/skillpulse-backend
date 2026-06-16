import { Router } from "express";
import { isAuth } from "../middleware/auth-middleware";
import {
  getPlans,
  getMySubscription,
  changePlan,
  initializeUpgrade,
  verifyUpgrade,
} from "../controllers/billing-controller";

const router = Router();

router.get("/plans", getPlans);
router.get("/me", isAuth, getMySubscription);
router.post("/change-plan", isAuth, changePlan);
router.post("/initialize-upgrade", isAuth, initializeUpgrade);
router.get("/verify", isAuth, verifyUpgrade); // new

export default router;