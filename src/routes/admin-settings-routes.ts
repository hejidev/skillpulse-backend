// routes/admin-settings-routes.ts
import { Router } from "express";
import { isAuth, adminOnly } from "../middleware/auth-middleware";
import {
  getAdminSettings,
  updateAdminSettings,
  forceLogoutAllUsers,
  sendTestEmail,
} from "../controllers/adminSettings.controller";

const router = Router();

// All routes below require authenticated admin
router.use(isAuth, adminOnly);

router.get("/settings", getAdminSettings);
router.put("/settings", updateAdminSettings);

router.post("/actions/force-logout-all", forceLogoutAllUsers);
router.post("/actions/test-email", sendTestEmail);

export default router;