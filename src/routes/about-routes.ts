import express from "express";

import {
  getAbout,
  getAdminAboutPage,
  updateAbout,
  deleteAbout,
} from "../controllers/about-controller";
import { isAuth } from "../middleware/auth-middleware";
import { requireRole } from "../middleware/role.middleware";





const router = express.Router();

/*
|--------------------------------------------------------------------------
| PUBLIC
|--------------------------------------------------------------------------
*/

router.get("/", getAbout);

/*
|--------------------------------------------------------------------------
| ADMIN
|--------------------------------------------------------------------------
*/

router.get(
  "/admin",
  isAuth,
  requireRole(
    "admin",
    "super_admin"
  ),
  getAdminAboutPage
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

/*
|--------------------------------------------------------------------------
| SUPER ADMIN
|--------------------------------------------------------------------------
*/

router.delete(
  "/admin",
  isAuth,
  requireRole("super_admin"),
  deleteAbout
);

export default router;