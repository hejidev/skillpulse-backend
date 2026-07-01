// routes/admin-security.routes.ts
import express from "express";
import { isAuth } from "../middleware/auth-middleware";
import { requireRole } from "../middleware/role.middleware";
import * as AdminSecurityController from "../controllers/adminSecurity.controller";

const router = express.Router();

// All routes require admin / super_admin
router.use(isAuth, requireRole("admin", "super_admin"));

// ========== Self sessions ==========
router.get("/sessions", AdminSecurityController.getMySessions);
router.post("/sessions/logout", AdminSecurityController.logoutMySession);
router.post("/sessions/logout-all", AdminSecurityController.logoutMySessionsEverywhere);

// ========== Global force logout ==========
router.post("/force-logout-all", AdminSecurityController.forceLogoutAllUsers);

// ========== MFA ==========
router.get("/mfa-stats", AdminSecurityController.getMfaStats);
router.get("/mfa-status", AdminSecurityController.getMyMfaStatus);

// ========== Security logs & threat feed ==========
router.get("/logs", AdminSecurityController.getSecurityLogsAdmin);
router.get("/threat-feed", AdminSecurityController.getThreatFeedAdmin);

// ========== Blocked IPs ==========
router.post("/actions/block-ip", AdminSecurityController.blockIp);
router.post("/actions/unblock-ip", AdminSecurityController.unblockIp);
router.get("/blocked-ips", AdminSecurityController.listBlockedIpsAdmin);

// ========== Trusted devices ==========
router.post("/actions/trust-device", AdminSecurityController.trustDevice);
router.post("/actions/revoke-device", AdminSecurityController.revokeDevice);
router.get("/trusted-devices", AdminSecurityController.listTrustedDevicesAdmin);

// ========== User isolation / lockdown ==========
router.post("/actions/isolate-user", AdminSecurityController.isolateUser);
router.post(
  "/actions/emergency-lockdown",
  AdminSecurityController.emergencyLockdown
);

// ========== Admin audit trail ==========
router.get("/actions", AdminSecurityController.listAdminSecurityActions);

// ========= Admin Login History ========
router.get("/login-history", AdminSecurityController.getMyLoginHistory);

// ========= Admin Risk Review ==========
router.get("/risk-overview", AdminSecurityController.getRiskOverview);

export default router;