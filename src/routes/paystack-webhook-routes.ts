// routes/paystack-webhook-routes.ts
import { Router } from "express";
import { paystackWebhookHandler } from "../controllers/paystack-webhook-controller";
import bodyParser from "body-parser";

const router = Router();

// Paystack sends raw body; we need raw buffer for signature verification
router.post(
  "/webhook/paystack",
  bodyParser.raw({ type: "application/json" }),
  paystackWebhookHandler
);

export default router;