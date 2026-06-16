// controllers/adminSettings.controller.ts
import { Response } from "express";
import { AuthRequest } from "../types/express";
import SystemSettings from "../models/SystemSettings";
import User from "../models/User";
import { io } from "../server"; // adjust path if needed
import { sendEmail } from "../services/email-service";

/**
 * Get current system settings (single document).
 */
export const getAdminSettings = async (req: AuthRequest, res: Response) => {
  let settings = await SystemSettings.findOne();

  if (!settings) {
    settings = await SystemSettings.create({});
  }

  return res.json(settings);
};

/**
 * Update system settings.
 */
export const updateAdminSettings = async (req: AuthRequest, res: Response) => {
  let settings = await SystemSettings.findOne();
  if (!settings) {
    settings = new SystemSettings();
  }

  const allowedFields = [
    "appName",
    "apiBaseUrl",
    "maintenanceMode",
    "debugMode",
    "enforce2FA",
    "trustedDevicesLock",
    "jwtRotationEnabled",
    "sessionMaxAgeMinutes",
    "openAIApiKey",
    "smtpConnectionString",
    "webhookUrl",
    "defaultTheme",
    "compactLayout",
    "reduceAnimations",
    "highContrast",
    "notifyOnPlanChange",
    "notifyOnSecurityEvents",
  ] as const;

  for (const key of allowedFields) {
    if (key in req.body) {
      // @ts-expect-error dynamic assign
      settings[key] = req.body[key];
    }
  }

  if (req.userId) {
    settings.updatedBy = req.userId as any;
  }

  await settings.save();

  // Optionally notify admin sockets that settings changed
  io.to("admin-notifications").emit("admin-event", {
    type: "settings",
    message: `System settings updated by ${req.name || "Admin"}`,
    at: new Date().toISOString(),
  });

  return res.json(settings);
};

/**
 * Force logout all users by bumping tokenVersion.
 */
export const forceLogoutAllUsers = async (req: AuthRequest, res: Response) => {
  await User.updateMany({}, { $inc: { tokenVersion: 1 } });

  io.to("admin-notifications").emit("admin-event", {
    type: "security",
    message: `Force logout triggered by ${req.name || "Admin"}`,
    at: new Date().toISOString(),
  });

  return res.json({ success: true });
};

/**
 * Simple test email using current SMTP settings.
 */
export const sendTestEmail = async (req: AuthRequest, res: Response) => {
  const { to } = req.body;
  if (!to) {
    return res.status(400).json({ message: "Missing 'to' field" });
  }

  try {
    await sendEmail(
      to,
      "SkillPulse Admin Test Email",
      "<p>This is a test email from SkillPulse admin settings.</p>"
    );
    return res.json({ success: true });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: "Failed to send test email",
      error: error?.message || String(error),
    });
  }
};