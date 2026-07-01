import express from "express";
import { isAuth } from "../middleware/auth-middleware";
import { requireRole } from "../middleware/role.middleware";
import * as ApiKeyController from "../controllers/apiKey.controller";
import SecurityLog from "../models/SecurityLog";

const router = express.Router();

// all routes require admin / super_admin
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

// Manage API keys for the current admin
router.get("/api-keys", ApiKeyController.listApiKeys);
router.post("/api-keys", ApiKeyController.createApiKey);
router.post("/api-keys/:id/revoke", ApiKeyController.revokeApiKey);
router.post("/api-keys/revoke-all", ApiKeyController.revokeAllApiKeys);

export default router;