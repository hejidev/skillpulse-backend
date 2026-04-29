import express from "express";
import { isAuth } from "../middleware/auth-middleware";
import { isAdmin } from "../middleware/role.middleware";

const router = express.Router();

router.get("/dashboard", isAuth, isAdmin, (req, res) => {
  res.json({
    message: "Welcome Admin 🚀",
  });
});

export default router;