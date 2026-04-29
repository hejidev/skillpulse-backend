// services/email-service.ts
import nodemailer from "nodemailer";

export const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export const sendEmail = async (
  to: string,
  subject: string,
  html?: string
) => {
  await transporter.sendMail({
    from: `"SkillPulse 🚀" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    html,
  });
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