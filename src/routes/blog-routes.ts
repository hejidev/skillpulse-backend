import express from "express";

import {
  createBlog,
  getPublishedBlogs,
  getSingleBlog,
  getAdminBlogs,
  getAdminBlogById,
  updateBlog,
  deleteBlog,
} from "../controllers/blog-controller";

import { isAuth } from "../middleware/auth-middleware";

import { requireRole } from "../middleware/role.middleware";

import { upload } from "../middleware/upload";

const router =
  express.Router();

/* =========================================
   CREATE BLOG
========================================= */
router.post(
  "/create",

  isAuth,

  requireRole(
    "admin",
    "super_admin"
  ),

  upload.single("thumbnail"),

  createBlog
);

/* =========================================
   PUBLIC BLOGS
========================================= */
router.get(
  "/published",
  getPublishedBlogs
);

/* =========================================
   ADMIN BLOGS
========================================= */
router.get(
  "/admin/all",

  isAuth,

  requireRole(
    "admin",
    "super_admin"
  ),

  getAdminBlogs
);

/* =========================================
   ADMIN  SINGLE BLOGS BY ID
========================================= */
router.get(
  "/admin/:id",
  isAuth,
  requireRole(
    "admin",
    "super_admin"
  ),
  getAdminBlogById
);

/* =========================================
   ADMIN UPDATE BLOG BY ID
========================================= */
router.put(
  "/admin/:id",
  isAuth,
  requireRole(
    "admin",
    "super_admin"
  ),
  upload.single("thumbnail"),
  updateBlog
);

/* =========================================
   ADMIN DELETE BLOG BY ID
========================================= */
router.delete(
  "/admin/:id",
  isAuth,
  requireRole(
    "admin",
    "super_admin"
  ),
  deleteBlog
);

router.get(
  "/:slug",
  getSingleBlog
);


export default router;