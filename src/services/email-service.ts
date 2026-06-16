// services/email-service.ts
import nodemailer from "nodemailer";
import EmailLog from "../models/EmailLog";
import { IUser } from "../models/User";
import { PlanId } from "../config/plans";

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || "smtp.gmail.com",
  port: Number(process.env.EMAIL_PORT) || 465,
  secure: process.env.EMAIL_SECURE === "false" ? false : true, // true for 465
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// const verifyLink =
//   `${process.env.FRONTEND_URL}/auth/verify-email?token=${token}`;

// console.log("VERIFY LINK:", verifyLink);

export const sendEmail = async (to: string, subject: string, html: string) => {
  try {
    const info = await transporter.sendMail({
      from: `"SkillPulse 🚀" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
    });

    // info.messageId is Nodemailer’s id
    await EmailLog.create({
      emailId: info.messageId,
      to,
      subject,
      status: "sent",
      error: null,
    });

    return info;
  } catch (error: any) {
    console.error("❌ EMAIL ERROR:", error);

    await EmailLog.create({
      emailId: null,
      to,
      subject,
      status: "failed",
      error: error?.message || String(error),
    });

    throw error;
  }
};

export const otpTemplate = (name: string, otp: string, ip: string, device: string) => {
  return `
  <div style="font-family: Arial; background:#0b0f19; color:#fff; padding:20px">
    <h2 style="color:#4ade80;">SkillPulse Security</h2>

    <p>Hello ${name},</p>

    <p>Your password reset code is:</p>

    <h1 style="letter-spacing:5px; color:#4ade80;">${otp}</h1>

    <p>This code expires in 10 minutes.</p>

    <hr style="border:0.5px solid #333" />

    <p style="font-size:12px; color:#aaa;">
      Request from: ${ip}<br/>
      Device: ${device}
    </p>

    <p style="font-size:12px; color:#aaa;">
      If this wasn't you, secure your account immediately.
    </p>
  </div>
  `;
};

export const planChangeTemplate = ({
  name,
  oldPlan,
  newPlan,
  amountDeltaNGN,
}: {
  name: string;
  oldPlan: string;
  newPlan: string;
  amountDeltaNGN: number;
}) => {
  const isUpgrade = amountDeltaNGN > 0;
  const deltaAbs = Math.abs(amountDeltaNGN).toLocaleString("en-NG");

  return `
  <div style="font-family: Arial; background:#0b0f19; color:#fff; padding:20px">
    <h2 style="color:#4ade80;">SkillPulse Billing Update</h2>

    <p>Hello ${name},</p>

    <p>Your subscription plan has been updated:</p>

    <p style="margin:10px 0;">
      <strong>${oldPlan.toUpperCase()}</strong> → <strong>${newPlan.toUpperCase()}</strong>
    </p>

    <p style="margin:10px 0;">
      This is a ${isUpgrade ? "<span style='color:#4ade80;'>plan upgrade</span>" : "<span style='color:#f97373;'>plan downgrade</span>"}.
    </p>

    <p style="margin:10px 0;">
      Monthly change: <strong style="color:${isUpgrade ? "#4ade80" : "#f97373"};">
        ${isUpgrade ? "+" : "-"}₦${deltaAbs}
      </strong>
    </p>

    <p style="font-size:12px; color:#aaa; margin-top:20px;">
      If you did not request this change, please contact support immediately.
    </p>
  </div>
  `;
};

export const notifyPlanChange = async (
  user: IUser,
  oldPlan: PlanId,
  newPlan: PlanId,
  amountDeltaNGN: number
) => {
  const html = planChangeTemplate({
    name: user.name,
    oldPlan,
    newPlan,
    amountDeltaNGN,
  });

  // Email user
  await sendEmail(
    user.email,
    `Your SkillPulse plan changed: ${oldPlan} → ${newPlan}`,
    html
  );

  // Optionally email admin
  if (process.env.ADMIN_EMAIL) {
    const adminHtml = `
      <div style="font-family: Arial; background:#0b0f19; color:#fff; padding:20px">
        <h2 style="color:#60a5fa;">Plan Change Notification</h2>
        <p>User: ${user.name} (${user.email})</p>
        <p>Plan: ${oldPlan.toUpperCase()} → ${newPlan.toUpperCase()}</p>
        <p>Delta: ${amountDeltaNGN >= 0 ? "+" : "-"}₦${Math.abs(
          amountDeltaNGN
        ).toLocaleString("en-NG")} per month</p>
      </div>
    `;

    await sendEmail(
      process.env.ADMIN_EMAIL,
      `Billing event: ${oldPlan} → ${newPlan}`,
      adminHtml
    );
  }
};