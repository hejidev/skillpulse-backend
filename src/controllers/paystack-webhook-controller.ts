// controllers/paystack-webhook-controller.ts
import { Request, Response } from "express";
import crypto from "crypto";
import User from "../models/User";
import { PLANS, PlanId } from "../config/plans";

export const paystackWebhookHandler = async (req: Request, res: Response) => {
  try {
    const signature = req.headers["x-paystack-signature"] as string | undefined;
    const secret = process.env.PAYSTACK_SECRET_KEY || "";

    const hash = crypto
      .createHmac("sha512", secret)
      .update(req.body)
      .digest("hex");

    if (!signature || hash !== signature) {
      console.warn("Invalid Paystack webhook signature");
      return res.status(400).send("Invalid signature");
    }

    const event = JSON.parse(req.body.toString());

    const { event: eventType, data } = event;

    // Handle charge.success to confirm subscription start
    if (eventType === "charge.success") {
      const email = data.customer.email;
      const metadata = data.metadata || {};
      const targetPlanId = metadata.targetPlanId as PlanId | undefined;

      if (!targetPlanId) {
        return res.status(200).send("No target plan metadata");
      }

      const user = await User.findOne({ email });
      if (!user) {
        return res.status(200).send("User not found, but webhook ok");
      }

      // Update billing info
      user.billing = {
        ...user.billing,
        paystackCustomerCode: data.customer.customer_code,
        paystackSubscriptionId: data.subscription?.subscription_code || user.billing?.paystackSubscriptionId,
        status: "active",
        currentPeriodStart: new Date(data.paid_at),
        currentPeriodEnd: new Date(
          data.paid_at || new Date()
        ), // later replace with real period end
      } as any;

      user.plan = targetPlanId;
      user.premium = targetPlanId !== "free";
      await user.save();

      console.log("User upgraded via Paystack:", user.email, targetPlanId);
      return res.status(200).send("Charge processed");
    }

    // You can also handle subscription.disable, invoice.failed, etc.

    return res.status(200).send("Event ignored");
  } catch (err) {
    console.error("Paystack webhook error:", err);
    return res.status(500).send("Webhook error");
  }
};