// routes/admin-security.ts
import { Router } from "express";
import { isAuth } from "../middleware/auth-middleware";
import {
  blockIpAdmin,
  getSecurityLogsAdmin,
  getThreatFeedAdmin,
  listBlockedIpsAdmin,
  listTrustedDevicesAdmin,
  revokeTrustedDeviceAdmin,
  trustDeviceAdmin,
  unblockIpAdmin,
} from "../controllers/adminSecurity.controller";
import { requireRole } from "../middleware/role.middleware";

const router = Router();

router.get(
  "/logs",
  isAuth,
  requireRole("admin", "super_admin"),
  getSecurityLogsAdmin
);

router.get(
  "/threat-feed",
  isAuth,
  requireRole("admin", "super_admin"),
  getThreatFeedAdmin
);

router.post(
  "/block-ip",
  isAuth,
  requireRole("admin", "super_admin"),
  blockIpAdmin
);

router.get(
  "/blocked-ips",
  isAuth,
  requireRole("admin", "super_admin"),
  listBlockedIpsAdmin
);

router.post(
  "/unblock-ip",
  isAuth,
  requireRole("admin", "super_admin"),
  unblockIpAdmin
);

router.post(
  "/trust-device",
  isAuth,
  requireRole("admin", "super_admin"),
  trustDeviceAdmin
);

router.get(
  "/trusted-devices",
  isAuth,
  requireRole("admin", "super_admin"),
  listTrustedDevicesAdmin
);

router.post(
  "/revoke-device",
  isAuth,
  requireRole("admin", "super_admin"),
  revokeTrustedDeviceAdmin
);

export default router;