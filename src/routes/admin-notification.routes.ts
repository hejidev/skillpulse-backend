import express from "express";

import {
  getAdminNotifications,
  getUnreadNotifications,
  markNotificationRead,
  archiveNotification,
  markAllNotificationsRead,
  deleteNotification,
  getNotificationStats,
  archiveMany,
} from "../controllers/admin-notification.controller";
import { isAuth } from "../middleware/auth-middleware";
import { requireRole } from "../middleware/role.middleware";

const router = express.Router();

router.get(
  "/",
  isAuth,
  getAdminNotifications
);

router.get(
  "/unread",
  isAuth,
  getUnreadNotifications
);

router.patch(
  "/:id/read",
  isAuth,
  markNotificationRead
);

router.patch(
  "/:id/archive",
  isAuth,
  archiveNotification
);

router.patch(
  "/read-all",
  isAuth,
  markAllNotificationsRead
);

router.delete(
  "/:id",
  isAuth,
  deleteNotification
);

router.get(
  "/stats",
  isAuth,
  requireRole(
      "admin",
      "super_admin"
    ),
  getNotificationStats
);

router.patch(
  "/archive-many",
  isAuth,
  archiveMany
);

export default router;