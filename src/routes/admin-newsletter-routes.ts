// routes/admin-newsletter-routes.ts
import express from "express";
import { isAuth, adminOnly } from "../middleware/auth-middleware";
import { listNewsletters, sendNewsletter, sendTestNewsletter } from "../controllers/admin-newsletter-controller";

const router = express.Router();

router.post("/newsletter/send-test", isAuth, adminOnly, sendTestNewsletter);
router.post("/newsletter/send", isAuth, adminOnly, sendNewsletter);
router.get("/newsletter/history", isAuth, adminOnly, listNewsletters);

export default router;