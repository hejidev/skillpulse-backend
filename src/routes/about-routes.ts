import express from "express";

import {
  getPublicAbout,
  getAdminAbout,
  updateAbout,
  updateAboutStatus,
  deleteAbout,
  getAboutAnalytics,
  uploadAboutImage,
} from "../controllers/about-controller";

import { isAuth } from "../middleware/auth-middleware";

import { requireRole }
from "../middleware/role.middleware";
import { upload } from "../middleware/upload";

const router =
  express.Router();

/* =========================
   PUBLIC
========================= */

router.get(
  "/",
  getPublicAbout
);

/* =========================
   ADMIN
========================= */

router.get(
  "/admin",
  isAuth,
  requireRole(
    "admin",
    "super_admin"
  ),
  getAdminAbout
);

router.get(
  "/admin/analytics",
  isAuth,
  requireRole(
    "admin",
    "super_admin"
  ),
  getAboutAnalytics
);

router.put(
  "/admin",
  isAuth,
  requireRole(
    "admin",
    "super_admin"
  ),
  updateAbout
);

router.patch(
  "/admin/status",
  isAuth,
  requireRole(
    "admin",
    "super_admin"
  ),
  updateAboutStatus
);


/* ========== ADMIN IMAGE UPLOAD (Cloudinary) ========== */
router.post(
  "/admin/upload-image",
  isAuth,
  requireRole("admin", "super_admin"),
  upload.single("image"), // field name: "image"
  uploadAboutImage as unknown as express.RequestHandler
);

/* =========================
   SUPER ADMIN
========================= */
router.delete(
  "/admin/:id",
  isAuth,
  requireRole(
    "admin",
    "super_admin"
  ),
  deleteAbout
);

export default router;