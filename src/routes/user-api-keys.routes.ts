// routes/user-api-keys.routes.ts
import express from "express";
import { isAuth } from "../middleware/auth-middleware";
import * as ApiKeyController from "../controllers/apiKey.controller";

const router = express.Router();

// all routes require a logged-in user (any role)
router.use(isAuth);

// Manage API keys for the current user
router.get("/api-keys", ApiKeyController.listApiKeys);
router.post("/api-keys", ApiKeyController.createApiKey);
router.post("/api-keys/:id/revoke", ApiKeyController.revokeApiKey);
router.post("/api-keys/revoke-all", ApiKeyController.revokeAllApiKeys);

export default router;