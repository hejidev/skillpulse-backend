// routes/admin-billing-routes.ts
import { Router } from "express";
import { isAuth } from "../middleware/auth-middleware";
import { requireRole } from "../middleware/role.middleware"; // we'll write this
import {
  getAdminBillingOverview,
  getAdminBillingUsers,
  getAdminBillingEvents,
  adminChangeUserPlan,
  listPlans,
  upsertPlan,
} from "../controllers/admin-billing-controller";


const router = Router();

// Protect all admin billing routes
router.use(isAuth, requireRole("admin", "super_admin"));

router.get("/overview", getAdminBillingOverview);
router.get("/users", getAdminBillingUsers);
router.get("/events", getAdminBillingEvents);
router.post("/users/:userId/change-plan", adminChangeUserPlan);

router.get("/plans", requireRole("admin", "super_admin"), listPlans);
router.post("/plans", requireRole("admin", "super_admin"), upsertPlan);

export default router;