// routes/newsletter-routes.ts
import express from "express";
import {
  subscribeFooter,
//   confirmSubscription,
  unsubscribe,
} from "../controllers/subscriber-controller";

const router = express.Router();

router.post("/subscribe", subscribeFooter);
// router.get("/confirm", confirmSubscription);
router.get("/unsubscribe", unsubscribe);

export default router;