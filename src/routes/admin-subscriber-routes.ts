// routes/admin-subscriber-routes.ts
import express from "express";
import { isAuth, adminOnly } from "../middleware/auth-middleware";
import { exportSubscribersCsv, listSubscribers, updateSubscriberStatus } from "../controllers/admin-subscriber-controller";

const router = express.Router();

// routes/admin-subscriber-routes.ts
router.get("/subscribers", isAuth, adminOnly, listSubscribers);
router.patch("/subscribers/:id/status", isAuth, adminOnly, updateSubscriberStatus);
router.get("/subscribers/export", isAuth, adminOnly, exportSubscribersCsv);

export default router;