import express from "express";
import { isAuth } from "../middleware/auth-middleware";
import {
  updateProfile,
  changePassword,
  deleteAccount,
  getProfile,
  updateTheme,
  exportUserData,
  getSecurityLogs,
  getReminder,
  getNotifications,
  markNotificationsRead,
  updateNotifications,
  deleteNotification,
  clearNotifications,
  markOneRead,
  archiveNotification,
  clearArchived,
} from "../controllers/settings-controller";
import { upload } from "../middleware/upload";
import { logoutDevice } from "../controllers/auth-controller";

import {
  startTwoFactorSetup,
  confirmTwoFactorSetup,
  disableTwoFactor,
  getTwoFactorStatus,
} from "../controllers/twofactor-controller";

const router = express.Router();

router.get("/me", isAuth, getProfile);
router.put("/profile", isAuth,  upload.single("avatar"), updateProfile);
router.get("/notifications", isAuth, getNotifications);
router.put("/notifications", isAuth, updateNotifications);
router.put("/notifications/:id/read", isAuth, markOneRead);
router.put("/notifications/:id/archive", isAuth, archiveNotification);
router.delete("/notifications/archived", isAuth, clearArchived);
router.put("/notifications/read", isAuth, markNotificationsRead);
router.delete("/notifications/:id", isAuth, deleteNotification);
router.delete("/notifications", isAuth, clearNotifications);
router.get("/reminder", isAuth, getReminder);
router.get("/export", isAuth, exportUserData);
router.put("/theme", isAuth, updateTheme);
router.put("/password", isAuth, changePassword);
router.delete("/account", isAuth, deleteAccount);
router.get("/security-logs", isAuth, getSecurityLogs);
router.post("/logout-device", isAuth, logoutDevice);

router.get("/2fa/status", isAuth, getTwoFactorStatus);
router.post("/2fa/start", isAuth, startTwoFactorSetup);
router.post("/2fa/confirm", isAuth, confirmTwoFactorSetup);
router.post("/2fa/disable", isAuth, disableTwoFactor);

export default router;