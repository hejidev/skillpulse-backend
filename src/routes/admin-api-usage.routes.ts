// routes/admin-api-usage.routes.ts
import express from "express";
import { isAuth } from "../middleware/auth-middleware";
import { requireRole } from "../middleware/role.middleware";
import SecurityLog from "../models/SecurityLog";

const router = express.Router();

router.use(isAuth, requireRole("admin", "super_admin"));

router.get("/api-usage", async (req, res) => {
  const { userId, limit = 50 } = req.query;

  const query: any = { action: { $regex: "^API Key Call" } };
  if (userId) query.userId = userId;

  const logs = await SecurityLog.find(query)
    .sort({ createdAt: -1 })
    .limit(Number(limit))
    .lean();

  return res.json({ items: logs });
});

export default router;