// controllers/admin-newsletter-controller.ts  👈 THIS FILE
import { Request, Response } from "express";
import Subscriber from "../models/Subscriber";
import Message from "../models/Message";
import { sendEmail } from "../services/email-service";
import EmailLog from "../models/EmailLog";
import { createAdminNotification } from "../services/admin-notification.service";

const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3000";


export const sendTestNewsletter = async (req: Request, res: Response) => {
  const { subject, html, to } = req.body;
  if (!subject || !html || !to) {
    return res.status(400).json({ message: "Subject, content and test recipient are required" });
  }

  const unsubscribeText = "You are receiving this test email from SkillPulse.";
  const wrappedHtml = `${html}
    <p style="font-size:12px;color:#9ca3af;margin-top:24px">
      ${unsubscribeText}
    </p>`;

  await sendEmail(to, `[TEST] ${subject}`, wrappedHtml);
  await EmailLog.create({ to, subject: `[TEST] ${subject}`, status: "sent" });

  return res.json({ success: true });
};

export const sendNewsletter = async (req: Request, res: Response) => {
  const { subject, html, segment } = req.body;

  if (!subject || !html) {
    return res
      .status(400)
      .json({ message: "Subject and content are required" });
  }

  const filter: any = {};
if (segment === "confirmed") {
  filter.status = "confirmed";
} // else "all" → no filter

  const subs = await Subscriber.find(filter);
  if (!subs.length) {
    return res.status(400).json({ message: "No subscribers to send to" });
  }

  const msg = await Message.create({
    title: subject,
    content: html,
    type: "broadcast",
    category: "broadcast",
    status: "pending",
    priority: "medium",
    sender: {
      id: (req as any).userId,
      role: "admin",
    },
    recipients: {
      segment: "all",
      userIds: [],
    },
    deliveryStats: { sent: 0, delivered: 0, failed: 0, opened: 0, clicked: 0 },
  });

  let sent = 0;
  let failed = 0;

  for (const sub of subs) {
    // 👇 put unsubscribe URL + wrappedHtml here
    // controllers/admin-newsletter-controller.ts – inside sendNewsletter loop

    const unsubscribePageUrl = `${FRONTEND_URL}/company/newsletter/preferences?email=${encodeURIComponent(
      sub.email
    )}`;

    const wrappedHtml = `${html}
  <p style="font-size:12px;color:#9ca3af;margin-top:24px">
    You’re receiving this because you subscribed to SkillPulse updates.
    <a href="${unsubscribePageUrl}" style="color:#9ca3af">Unsubscribe</a>
  </p>`;

    try {
      await sendEmail(sub.email, subject, wrappedHtml);
      sent++;
      sub.lastEmailAt = new Date();
      await sub.save();

      await EmailLog.create({
        to: sub.email,
        subject,
        status: "sent",
      });
    } catch (err: any) {
      failed++;
      await EmailLog.create({
        to: sub.email,
        subject,
        status: "failed",
        error: err?.message,
      });
    }
  }

  msg.status = "sent";
  msg.deliveryStats.sent = sent + failed;
  msg.deliveryStats.delivered = sent;
  msg.deliveryStats.failed = failed;
  await msg.save();

  await createAdminNotification({
    title: "Newsletter sent",
    message: `Newsletter "${subject}" sent to ${sent} subscribers (${failed} failed).`,
    category: "message",
    severity: failed > 0 ? "warning" : "success",
    metadata: { messageId: msg._id, sent, failed },
  });

  return res.json({
    success: true,
    sent,
    failed,
  });
};

export const listNewsletters = async (req: Request, res: Response) => {
  const messages = await Message.find({ type: "broadcast" })
    .sort({ createdAt: -1 })
    .limit(50);

  return res.json({ messages });
};