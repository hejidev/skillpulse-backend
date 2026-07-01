import { Request, Response } from "express";
import { AuthRequest } from "../types/express";
import User from "../models/User";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import jwt from "jsonwebtoken";

import speakeasy from "speakeasy";

import { validationResult } from "express-validator";
import { sendEmail } from "../services/email-service";
import { otpTemplate } from "../services/email-template";
import SecurityLog from "../models/SecurityLog";
import { generateDeviceHash } from "../utils/device";
import { logActivity } from "../lib/activity";
import { createAdminNotification } from "../services/admin-notification.service";
import { signAccessToken } from "../utils/sessionMaxAgeMinutes";
import { signRefreshToken } from "../utils/tokens";
import { verifyRefreshToken, rotateTokens } from "../utils/tokens";
import { generateUniqueReferralCode } from "../utils/referral";
import Referral from "../models/Referral";


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


// async function verifyTwoFactorCode(user: any, code: string): Promise<boolean> {
//   if (!user.twoFactorSecret) return false;

//   // in verifyTwoFactorCode
//   console.log("LOGIN 2FA VERIFY", {
//     userId: user._id.toString(),
//     email: user.email,
//     secret: user.twoFactorSecret,
//     code,
//   });

//   return speakeasy.totp.verify({
//     secret: user.twoFactorSecret,
//     encoding: "base32",
//     token: code.trim().replace(/\s/g, ""),
//     window: 2, // allow ±2 time step for clock drift
//   });
// }

async function verifyTwoFactorCode(user: any, code: string): Promise<boolean> {
  const expected = speakeasy.totp({
    secret: user.twoFactorSecret,
    encoding: "base32",
  });

  console.log({
    storedSecret: user.twoFactorSecret,
    expectedCode: expected,
    receivedCode: code,
  });

  return expected === code.trim();
}


// ================= REGISTER =================
export const register = async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty())
      return res.status(400).json(errors.array());

    const { name, email, password, ref } = req.body;

    const existing = await User.findOne({ email });
    if (existing)
      return res.status(400).json({ message: "Email already exists" });

    const hashed = await bcrypt.hash(password, 12);
    const token = crypto.randomBytes(32).toString("hex");

    const isAdmin = email === process.env.ADMIN_EMAIL;

    const SKIP_EMAIL_VERIFICATION =
      process.env.SKIP_EMAIL_VERIFICATION === "true";


    // 1) Create user
    const referralCode = await generateUniqueReferralCode();

    // const user = await User.create({
    //   name,
    //   email,
    //   password: hashed,
    //   role: isAdmin ? "admin" : "user",
    //   isVerified: isAdmin ? true : false,
    //   emailToken: isAdmin ? token : undefined,
    //   emailTokenExpires: 
    //   isAdmin
    //     ? undefined
    //     : new Date(Date.now() + 1000 * 60 * 60),
    //   referralCode,
    // });

    const user = await User.create({
      name,
      email,
      password: hashed,
      role: isAdmin ? "admin" : "user",
      isVerified: isAdmin ? true : SKIP_EMAIL_VERIFICATION ? true : false,
      emailToken: !isAdmin && !SKIP_EMAIL_VERIFICATION ? token : undefined,
      emailTokenExpires:
        !isAdmin && !SKIP_EMAIL_VERIFICATION
          ? new Date(Date.now() + 1000 * 60 * 60)
          : undefined,
      referralCode,
    });

    // 2) If they signed up with a referral
    if (ref) {
      const referrer = await User.findOne({ referralCode: ref }).select("_id");
      if (referrer) {
        user.referredByCode = ref;
        user.referredByUserId = referrer._id;
        await user.save();

        await Referral.create({
          code: ref,
          referrerId: referrer._id,
          referredUserId: user._id,
          status: "signed_up",
        });
      }
    }

    // 🔥 ALWAYS SEND EMAIL IF NOT VERIFIED
    if (!isAdmin && !SKIP_EMAIL_VERIFICATION) {
      const verifyLink = `${process.env.FRONTEND_URL}/auth/verify-email?token=${token}`;

      await sendEmail(
        email,
        "Verify your account",
        `<div style="font-family:Arial;padding:20px;background:#0f172a;color:#fff">
          <div style="max-width:500px;margin:auto;background:#111827;padding:30px;border-radius:10px">
            <h2 style="color:#22c55e">Welcome 🚀</h2>
            <p>Hi ${name},</p>
            <a href="${verifyLink}" style="padding:12px 20px;background:#22c55e;color:#fff;text-decoration:none;border-radius:6px;display:inline-block;cursor:pointer;margin-top:20px">
              Verify Email
            </a>
          </div>
        </div>`
      ).catch(console.log);
    }

    await createAdminNotification({
      title: "New User Registered",

      message:
        `${user.name} created an account`,

      category: "user",

      severity: "success",

      metadata: {
        userId: user._id,
        email: user.email,
      },
    });

    return res.json({
      success: true,
      message: "Account created successfully. Please verify your email.",
    });
  } catch (error) {
    console.log("REGISTER ERROR:", error);
    return res.status(500).json({ message: "Registration failed" });
  }
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

  await createAdminNotification({
    title: "Email Verified",

    message:
      `${user.name} verified email address`,

    category: "user",

    severity: "success",

    metadata: {
      userId: user._id,
    },
  });

  res.json({ message: "Email verified successfully 🎉" });
};

// ================= LOGIN =================
export const login = async (req: AuthRequest, res: Response) => {
  try {
    const { email, password, deviceId, twoFactorCode, trustDevice } = req.body;
    const settings = (req as any).systemSettings;

    // temp: disable enforce2FA while you get setup flow working
    // const settings = (req as any).systemSettings;
    // settings.enforce2FA = false;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const SKIP_EMAIL_VERIFICATION =
      process.env.SKIP_EMAIL_VERIFICATION === "true";

    if (!SKIP_EMAIL_VERIFICATION && !user.isVerified) {
      return res.status(403).json({
        message: "Please verify your email before logging in.",
      });
    }

    // === Device fingerprint / trusted devices ===
    const rawIP =
      (req.headers["x-forwarded-for"] as string) ||
      req.socket.remoteAddress ||
      "unknown";

    const ip = rawIP.replace("::ffff:", "");
    const device = req.headers["user-agent"] || "unknown device";
    const deviceHash = generateDeviceHash(ip, device);

    user.trustedDevices = user.trustedDevices || [];
    user.notifications = user.notifications || [];
    user.securityFlags = user.securityFlags || [];

    const isTrusted = user.trustedDevices.some(
      (d: any) => d.deviceHash === deviceHash
    );

    // Optional 2FA: only apply if user.twoFactorEnabled is true
    if (user.twoFactorEnabled) {
      if (!twoFactorCode) {
        return res.status(403).json({
          require2faVerify: true,
          message: "2FA verification required.",
        });
      }

      const ok = await verifyTwoFactorCode(user, twoFactorCode.replace(/\s/g, ""));
      if (!ok) {
        return res.status(403).json({ message: "Invalid 2FA code." });
      }
    }

    // If device not trusted, send security email & logs
    if (!isTrusted) {
      await sendEmail(
        user.email,
        "New Device Login Alert",
        `<div style="font-family:Arial;padding:20px">
          <h2>Security Alert 🚨</h2>
          <p>New login detected</p>
          <p><b>IP:</b> ${ip}</p>
          <p><b>Device:</b> ${device}</p>
        </div>`
      ).catch(console.log);

      user.trustedDevices.push({
        deviceHash,
        device,
        ip,
        lastUsed: new Date(),
      });

      user.notifications.push({
        message: `🚨 New login detected from ${device}`,
        type: "warning",
        read: false,
        archived: false,
        createdAt: new Date(),
      });

      user.riskScore = (user.riskScore || 0) + 15;

      if (!user.securityFlags.includes("New untrusted device login")) {
        user.securityFlags.push("New untrusted device login");
      }

      await logActivity({
        userId: user._id.toString(),
        type: "security_alert",
        title: "Security Alert",
        description: "New untrusted device login detected",
        severity: "danger",
        metadata: { ip, device },
      });

      await SecurityLog.create({
        userId: user._id.toString(),
        ip,
        device,
        action: "New Device Login",
        deviceHash,
        severity: "warning",
      });

      await createAdminNotification({
        title: "New Device Login",
        message: `${user.name} logged in from an untrusted device`,
        category: "security",
        severity: "warning",
        metadata: {
          userId: user._id,
          ip,
          device,
        },
      });
    } else {
      // update lastUsed if trusted
      const idx = user.trustedDevices.findIndex(
        (d: any) => d.deviceHash === deviceHash
      );
      if (idx !== -1) {
        user.trustedDevices[idx].lastUsed = new Date();
      }
    }

    user.isOnline = true;
    user.lastSeen = new Date();
    user.lastLoginAt = new Date();
    user.lastIP = ip;

    console.log("LOGIN BODY", { email, hasTwoFactorCode: !!twoFactorCode });

    await user.save();

    if (user.role === "admin" || user.role === "super_admin") {
      await createAdminNotification({
        title: "Admin Login",
        message: `${user.name} logged into the admin panel`,
        category: "auth",
        severity: "info",
        metadata: {
          adminId: user._id,
          email: user.email,
          ip,
          device,
        },
      });
    }

    const safeUser = await User.findById(user._id).select("-password -otp");

    // === Issue tokens (sessionMaxAgeMinutes applied in signAccessToken) ===
    const accessToken = signAccessToken(
      {
        userId: user._id.toString(),
        role: user.role,
        tokenVersion: user.tokenVersion,
      },
      req
    );

    const refreshToken = signRefreshToken(user._id.toString());

    const settingsForCookie = (req as any).systemSettings;
    const sessionMinutes =
      settingsForCookie?.sessionMaxAgeMinutes ?? 60 * 24;

    // optional: httpOnly cookie for access token
    res.cookie("access_token", accessToken, {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      maxAge: sessionMinutes * 60 * 1000,
    });

    return res.json({
      success: true,
      accessToken,
      refreshToken,
      user: safeUser,
    });
  } catch (error) {
    console.log("LOGIN ERROR:", error);
    return res.status(500).json({ message: "Login failed" });
  }
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

  if (!email || !otp || !newPassword) {
    return res.status(400).json({
      message: "All fields are required",
    });
  }

  if (newPassword.length < 8) {
    return res.status(400).json({
      message: "Password must be at least 8 characters",
    });
  }

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

  await createAdminNotification({
    title: "Password Reset",

    message:
      `${user.name} reset account password`,

    category: "security",

    severity: "warning",

    metadata: {
      userId: user._id,
      email: user.email,
    },
  });

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

export const logout = async (
  req: AuthRequest,
  res: Response
) => {
  await User.findByIdAndUpdate(
    req.userId,
    {
      isOnline: false,
      lastSeen: new Date(),
    }
  );

  res.json({
    success: true,
  });
};


export const refreshTokens = async (req: AuthRequest, res: Response) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(400).json({ message: "Missing refresh token" });
    }

    const decoded = verifyRefreshToken(refreshToken);
    const { accessToken, refreshToken: newRefreshToken } = await rotateTokens(
      req,
      decoded.userId
    );

    return res.json({
      success: true,
      accessToken,
      refreshToken: newRefreshToken,
    });
  } catch (error) {
    console.error("REFRESH ERROR:", error);
    return res.status(401).json({ message: "Invalid refresh token" });
  }
};