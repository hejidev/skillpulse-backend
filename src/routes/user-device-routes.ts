// routes/user-device-routes.ts
import { Router } from "express";
import { isAuth } from "../middleware/auth-middleware";
import { listMyDevices, revokeMyDevice } from "../controllers/userDevice.controller";

const router = Router();

// GET /api/me/devices
router.get("/me/devices", isAuth, listMyDevices);

// POST /api/me/devices/revoke
router.post("/me/devices/revoke", isAuth, revokeMyDevice);

export default router;