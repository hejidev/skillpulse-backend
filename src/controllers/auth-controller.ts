import { Request, Response } from "express";
import { AuthRequest } from "../types/express";
import User from "../models/User";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import { validationResult } from "express-validator";
import { sendEmail } from "../services/email-service";
import { otpTemplate } from "../services/email-template";
import SecurityLog from "../models/SecurityLog";
import { generateDeviceHash } from "../utils/device";

// ================= TOKENS =================
const generateTokens = (user: any) => {
  const JWT_SECRET = process.env.JWT_SECRET;
  const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;

  if (!JWT_SECRET || !JWT_REFRESH_SECRET) {
    console.error("❌ JWT ENV ERROR:", {
      JWT_SECRET,
      JWT_REFRESH_SECRET,
    });
    throw new Error("JWT secrets missing");
  }

  const accessToken = jwt.sign(
    {
      userId: user._id,
      role: user.role,
      tokenVersion: user.tokenVersion,
    },
    JWT_SECRET,
    { expiresIn: "15m" }
  );

  const refreshToken = jwt.sign(
    { userId: user._id },
    JWT_REFRESH_SECRET,
    { expiresIn: "7d" }
  );

  return { accessToken, refreshToken };
};

// ================= SECURITY LOGGER =================
export const logSecurityEvent = async (
  userId: string,
  req: Request,
  action: string
) => {
  await SecurityLog.create({
    userId,
    ip: req.ip,
    device: req.headers["user-agent"],
    action,
  });
};

// ================= REGISTER =================
export const register = async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty())
    return res.status(400).json(errors.array());

  const { name, email, password } = req.body;

  const existing = await User.findOne({ email });
  if (existing)
    return res.status(400).json({ message: "Email already exists" });

  const hashed = await bcrypt.hash(password, 12);

  // 🔐 CREATE EMAIL TOKEN
  const token = crypto.randomBytes(32).toString("hex");

  // ✅ CHECK IF ADMIN
  const isAdmin = email === process.env.ADMIN_EMAIL;

  const SKIP_EMAIL_VERIFICATION = process.env.SKIP_EMAIL_VERIFICATION === "true";

  const user = await User.create({
    name,
    email,
    password: hashed,

    role: isAdmin ? "admin" : "user",

    isVerified: isAdmin ? true : false,

    emailToken: isAdmin ? undefined : token,

    emailTokenExpires: isAdmin
      ? undefined
      : new Date(Date.now() + 1000 * 60 * 60),
  });

  // 📧 SEND EMAIL
  if (!isAdmin && !SKIP_EMAIL_VERIFICATION) {
    const verifyLink = `${process.env.FRONTEND_URL}/auth/verify-email?token=${token}`;

    try {
      await sendEmail(
        email,
        "Verify your account",
        `
  <div style="font-family:Arial;padding:20px;background:#0f172a;color:#fff">
    <div style="max-width:500px;margin:auto;background:#111827;padding:30px;border-radius:10px">
      
      <h2 style="color:#22c55e">Welcome to SkillPulse 🚀</h2>
      
      <p>Hi ${name},</p>
      <p>Click the button below to verify your account:</p>

      <a href="${verifyLink}" 
        style="
          display:inline-block;
          padding:12px 20px;
          background:#22c55e;
          color:#fff;
          text-decoration:none;
          border-radius:6px;
          margin-top:10px;
        ">
        Verify Email
      </a>

      <p style="margin-top:20px;font-size:12px;color:#9ca3af">
        This link expires in 1 hour.
      </p>

    </div>
  </div>
  `
      );
    } catch (err) {
      console.error("❌ EMAIL ERROR:", err);
    }
  }

  res.json({
    message: "Account created. Please verify your email.",
  });
};

export const verifyEmail = async (req: Request, res: Response) => {
  const token = req.query.token as string;

  const user = await User.findOne({
    emailToken: token,
    emailTokenExpires: { $gt: Date.now() },
  });

  if (!user) {
    return res.status(400).json({ message: "Invalid or expired token" });
  }

  user.isVerified = true;
  user.emailToken = undefined;
  user.emailTokenExpires = undefined;

  await user.save();

  res.json({ message: "Email verified successfully 🎉" });
};

// ================= LOGIN =================
// export const login = async (req: Request, res: Response) => {
//     const errors = validationResult(req);
//     if (!errors.isEmpty())
//         return res.status(400).json(errors.array());

//     const { email, password } = req.body;

//     const user = await User.findOne({ email });

//     if (!user)
//         return res.status(404).json({ message: "User not found" });

//     if (!user.isVerified && user.role !== "admin") {
//         return res.status(403).json({
//             message: "Please verify your email before login",
//         });
//     }

//     const match = await bcrypt.compare(password, user.password);

//     if (!match) {
//         await logSecurityEvent(user._id.toString(), req, "FAILED_LOGIN");
//         return res.status(400).json({ message: "Invalid credentials" });
//     }

//     await logSecurityEvent(user._id.toString(), req, "LOGIN");

//     if (user.lastIP && user.lastIP !== req.ip) {
//         await sendEmail(
//             user.email,
//             "⚠️ New Login Detected",
//             `<p>New login from IP: ${req.ip}</p>`
//         );
//     }

//     user.lastIP = req.ip;
//     await user.save();

//     const tokens = generateTokens(user);

//     res.json(tokens); // ✅ MUST match frontend
// };
export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });
  if (!user)
    return res.status(400).json({ message: "Invalid credentials" });

  // ✅ email verification check
  // if (!user.isVerified && user.role !== "admin") {
  //   return res.status(403).json({
  //     message: "Please verify your email before login",
  //   });
  // }

  const SKIP_EMAIL_VERIFICATION = process.env.SKIP_EMAIL_VERIFICATION === "true";

// email verification check
if (!SKIP_EMAIL_VERIFICATION) {
  if (!user.isVerified && user.role !== "admin") {
    return res.status(403).json({
      message: "Please verify your email before login",
    });
  }
}

  const match = await bcrypt.compare(password, user.password);
  if (!match)
    return res.status(400).json({ message: "Invalid credentials" });

  const ip =
    (req.headers["x-forwarded-for"] as string) ||
    req.socket.remoteAddress ||
    "unknown";

  const device = req.headers["user-agent"] || "unknown device";

  const deviceHash = generateDeviceHash(ip, device);

  // ✅ prevent crash
  if (!user.trustedDevices) {
    user.trustedDevices = [];
  }

  const isTrusted = user.trustedDevices.some(
    (d: any) => d.deviceHash === deviceHash
  );

  // 🚨 NEW DEVICE
  if (!isTrusted) {
    await User.findByIdAndUpdate(user._id, {
      $push: {
        notifications: {
          message: `🚨 New login detected from ${device}`,
          read: false,
          createdAt: new Date(),
        },
      },
    });

    await SecurityLog.create({
      userId: user._id.toString(),
      ip,
      device,
      action: "New Device Login",
      deviceHash,
      severity: "warning",
    });

    try {
      await sendEmail(
        user.email,
        "New Device Login Alert",
        `A new device just logged into your account.\nIP: ${ip}\nDevice: ${device}`
      );
    } catch (err) {
      console.error("❌ EMAIL ERROR:", err);
    }

    user.trustedDevices.push({
      deviceHash,
      device,
      ip,
      lastUsed: new Date(),
    });
  }

  await user.save();

  // ✅ tokens
  const tokens = generateTokens(user);

  res.json({
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
    user,
  });
};

// ================= FORGOT PASSWORD =================
export const forgotPassword = async (req: Request, res: Response) => {
  const { email } = req.body;

  const user = await User.findOne({ email });
  if (!user)
    return res.status(404).json({ message: "User not found" });

  const otp = Math.floor(100000 + Math.random() * 900000).toString();

  user.otp = await bcrypt.hash(otp, 10);
  user.otpExpires = new Date(Date.now() + 1000 * 60 * 10); // FIXED
  user.otpAttempts = 0;

  await user.save();

  const ip = req.ip || "Unknown";
  const device = req.headers["user-agent"] || "Unknown";

  try {
  await sendEmail(
    user.email,
    "🔐 Your Reset Code",
    otpTemplate(user.name, otp, ip, device)
  );
  } catch (err) {
    console.error("❌ EMAIL ERROR:", err);
  };

  await logSecurityEvent(user._id.toString(), req, "REQUEST_PASSWORD_RESET");

  res.json({ message: "OTP sent to email" });
};

// ================= VERIFY OTP =================
export const verifyOTPAndReset = async (req: Request, res: Response) => {
  const { email, otp, newPassword } = req.body;

  const user = await User.findOne({ email });

  if (!user || !user.otp)
    return res.status(400).json({ message: "Invalid request" });

  if (!user.otpExpires || user.otpExpires < new Date())
    return res.status(400).json({ message: "OTP expired" });

  if ((user.otpAttempts ?? 0) >= 5)
    return res.status(429).json({ message: "Too many attempts" });

  const isValid = await bcrypt.compare(otp, user.otp);

  if (!isValid) {
    user.otpAttempts = (user.otpAttempts ?? 0) + 1;
    await user.save();
    return res.status(400).json({ message: "Invalid OTP" });
  }

  // ✅ RESET PASSWORD
  user.password = await bcrypt.hash(newPassword, 12);

  user.otp = undefined;
  user.otpExpires = undefined;
  user.otpAttempts = 0;

  await user.save();

  await logSecurityEvent(user._id.toString(), req, "PASSWORD_RESET");

  res.json({ message: "Password reset successful" });
};

export const logoutDevice = async (req: AuthRequest, res: Response) => {
  const { deviceHash } = req.body;

  await User.findByIdAndUpdate(req.userId, {
    $pull: {
      trustedDevices: { deviceHash },
    },
  });

  await SecurityLog.create({
    userId: req.userId!,
    action: "Device Logged Out",
    severity: "warning",
  });

  res.json({ message: "Device logged out" });
};