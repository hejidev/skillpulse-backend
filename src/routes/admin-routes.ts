import express from "express";

import {
  getAllUsers,
  updateUserRole,
  suspendUser,
  activateUser,
  deleteUser,
  getAdminAnalytics,
  getAuditLogs,
} from "../controllers/admin-user-controller";

import {
  getAnalyticsDashboard,
} from "../controllers/analytics-controller";

import { isAuth } from "../middleware/auth-middleware";
import { requireRole } from "../middleware/role.middleware";
import { getActivityDashboard, getActivityFeed } from "../controllers/activity-admin-controller";
import { getAnalyticsHistory, getIntelligenceOverview } from "../controllers/intelligence-controller";
import { getAdminDashboardStats } from "../controllers/adminDashboard.controller";

const router = express.Router();

/* =========================================
   USERS
========================================= */

router.get("/dashboard", isAuth, requireRole("admin", "super_admin"), getAdminDashboardStats);

router.get(
  "/users",
  isAuth,
  requireRole("admin", "super_admin"),
  getAllUsers
);

router.put(
  "/users/role",
  isAuth,
  requireRole("super_admin", "admin"),
  updateUserRole
);

router.put(
  "/users/suspend",
  isAuth,
  requireRole("admin", "super_admin"),
  suspendUser
);

router.put(
  "/users/activate",
  isAuth,
  requireRole("admin", "super_admin"),
  activateUser
);

router.delete(
  "/users/:userId",
  isAuth,
  requireRole("super_admin", "admin"),
  deleteUser
);

router.get(
  "/analytics",
  isAuth,
  requireRole("admin", "super_admin"),
  getAdminAnalytics
);

router.get(
  "/audit-logs",
  isAuth,
  requireRole("admin", "super_admin"),
  getAuditLogs
);

router.get(
  "/dashboard-analytics",
  isAuth,
  requireRole("admin", "super_admin"),
  getAnalyticsDashboard
);

router.get(
  "/activity-dashboard",
  isAuth,
  requireRole("admin", "super_admin"),
  getActivityDashboard
);

router.get(
  "/activity-feed",
  isAuth,
  requireRole("admin", "super_admin"),
  getActivityFeed
);

router.get(
  "/intelligence-overview",
  isAuth,
  requireRole(
    "admin",
    "super_admin"
  ),
  getIntelligenceOverview
);

router.get(
  "/intelligence-history",
  isAuth,
  requireRole(
    "admin",
    "super_admin"
  ),
  getAnalyticsHistory
);


export default router;