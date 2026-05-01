// controllers/webhook-controller.ts
import { Request, Response } from "express";
import crypto from "crypto";
import EmailLog from "../models/EmailLog";

// 🔐 VERIFY SIGNATURE
const verifySignature = (req: Request) => {
  const signature = req.headers["resend-signature"] as string;

  const expected = crypto
    .createHmac("sha256", process.env.RESEND_WEBHOOK_SECRET!)
    .update(req.body) // IMPORTANT: raw buffer
    .digest("hex");

  return signature === expected;
};

// 🔁 OPTIONAL RETRY FUNCTION
const retryEmail = async (emailData: any) => {
  console.log("🔁 retrying email...", emailData);
  // you can re-call resend here if needed
};

export const handleResendWebhook = async (req: Request, res: Response) => {
  try {
    // ⚠️ SECURITY CHECK
    if (!verifySignature(req)) {
      return res.status(401).json({ error: "Invalid signature" });
    }

    // 📦 PARSE RAW BODY
    const event = JSON.parse(req.body.toString());

    console.log("📩 Resend Event:", event);

    const { type, data } = event;

    // 💾 SAVE LOG
    const log = await EmailLog.create({
      emailId: data?.email_id,
      to: data?.to?.[0],
      subject: data?.subject,
      status: type, // delivered, opened, bounced, etc
      error: data?.error || null,
    });

    // 🚨 HANDLE FAILED EMAILS
    if (type === "bounced") {
      await retryEmail(data);
    }

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error("❌ Webhook error:", err);
    return res.status(500).json({ error: "Webhook failed" });
  }
};