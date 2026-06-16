// controllers/subscriber-controller.ts
import { Request, Response } from "express";
import crypto from "crypto";
import Subscriber from "../models/Subscriber";
import { sendEmail } from "../services/email-service";
import { createAdminNotification } from "../services/admin-notification.service";
import EmailLog from "../models/EmailLog";

const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3000";

// controllers/subscriber-controller.ts

export const subscribeFooter = async (req: Request, res: Response) => {
  try {
    const { email, name } = req.body;
    if (!email) return res.status(400).json({ message: "Email is required" });

    const normalized = email.trim().toLowerCase();

    let sub = await Subscriber.findOne({ email: normalized });

    // already confirmed → just tell frontend it's already subscribed
    if (sub && sub.status === "confirmed") {
      return res.json({
        success: true,
        message: "You’re already subscribed.",
      });
    }

    if (!sub) {
      sub = await Subscriber.create({
        email: normalized,
        name,
        source: "footer",
        status: "confirmed",       // ✅ directly confirmed
        verificationToken: undefined,
        tags: ["newsletter"],
      });
    } else {
      sub.status = "confirmed";    // ✅ re‑confirm if they had unsubscribed
      sub.verificationToken = undefined;
      await sub.save();
    }

    // OPTIONAL: send a simple welcome email (no confirm button)
    const subject = "Welcome to the SkillPulse newsletter";
    const html = `
      <div style="font-family:system-ui;padding:24px;background:#020617;color:#e5e7eb">
        <div style="max-width:520px;margin:auto;background:#020617;border-radius:16px;padding:24px;border:1px solid #1f2937">
          <h2 style="color:#22c55e;margin-bottom:8px">You’re in 🎉</h2>
          <p style="font-size:14px;line-height:1.6">
            You’ll now receive product updates, growth tips, and progress stories from SkillPulse.
          </p>
        </div>
      </div>
    `;

    try {
      await sendEmail(normalized, subject, html);
      await EmailLog.create({ to: normalized, subject, status: "sent" });
    } catch (err: any) {
      await EmailLog.create({
        to: normalized,
        subject,
        status: "failed",
        error: err?.message,
      });
    }

    await createAdminNotification({
      title: "New newsletter signup",
      message: `${normalized} subscribed via footer`,
      category: "analytics",
      severity: "info",
      metadata: { email: normalized, source: "footer" },
    });

    return res.json({
      success: true,
      message: "You’re subscribed to SkillPulse.",
    });
  } catch (err) {
    console.error("SUBSCRIBE ERROR", err);
    return res.status(500).json({ message: "Subscription failed" });
  }
};


export const unsubscribe = async (req: Request, res: Response) => {
  const { email } = req.query;
  if (!email || typeof email !== "string") {
    return res.status(400).json({ message: "Invalid email" });
  }

  const normalized = email.toLowerCase();
  const sub = await Subscriber.findOne({ email: normalized });
  if (!sub) {
    return res.status(404).json({ message: "Subscriber not found" });
  }

  sub.status = "unsubscribed";
  sub.unsubscribedAt = new Date();
  await sub.save();

  await createAdminNotification({
    title: "Newsletter unsubscribed",
    message: `${sub.email} unsubscribed from newsletter`,
    category: "analytics",
    severity: "warning",
    metadata: { email: sub.email },
  });

  // ✅ API-style response, no redirect
  return res.json({
    success: true,
    message: "You have been unsubscribed.",
  });
};