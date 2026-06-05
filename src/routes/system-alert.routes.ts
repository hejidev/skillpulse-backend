import express from "express";
import { acknowledgeAlert, createAlert, escalateAlert, resolveAlert, updateAlert } from "../controllers/system-alert.controller";
import { isAuth } from "../middleware/auth-middleware";
import { requireRole } from "../middleware/role.middleware";

const router = express.Router();

router.post(
  "/create",
  isAuth,
  requireRole("admin", "super_admin"),
  createAlert
);

router.put(
  "/:id",
  isAuth,
  requireRole("admin", "super_admin"),
  updateAlert
);

router.patch("/:id/acknowledge", isAuth, acknowledgeAlert);
router.patch("/:id/resolve", isAuth, resolveAlert);
router.patch("/:id/escalate", isAuth, escalateAlert);

export default router;