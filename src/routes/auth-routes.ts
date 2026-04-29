import express from "express";
import {
  register,
  login,
  forgotPassword,
  verifyOTPAndReset,
  verifyEmail,
} from "../controllers/auth-controller";

import { body } from "express-validator";
import rateLimit from "express-rate-limit";
import { isAuth } from "../middleware/auth-middleware";

const router = express.Router();

// 🔐 Auth limiter (FIXED export issue)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: "Too many attempts, try again later.",
});

router.post(
  "/register",
  [
    body("email").isEmail(),

    body("password")
      .isLength({ min: 6 })
      .withMessage("Password must be at least 6 characters")
      .matches(/[A-Z]/)
      .withMessage("Must include uppercase letter")
      .matches(/[a-z]/)
      .withMessage("Must include lowercase letter")
      .matches(/[0-9]/)
      .withMessage("Must include number")
      .matches(/[^A-Za-z0-9]/)
      .withMessage("Must include special character"),

    body("name").notEmpty(),
  ],
  register
);

router.post(
  "/login",
  authLimiter,
  [body("email").isEmail(), body("password").notEmpty()],
  login
);

router.get("/verify-email", verifyEmail);
router.post("/forgot-password", forgotPassword);
router.post("/verify-otp", verifyOTPAndReset);

export default router;