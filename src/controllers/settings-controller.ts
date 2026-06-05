import { Response } from "express";
import User from "../models/User";
import bcrypt from "bcryptjs";
import { AuthRequest } from "../types/express";
import SecurityLog from "../models/SecurityLog";
import { logActivity } from "../lib/activity";

// ================= PROFILE =================
export const getProfile = async (req: AuthRequest, res: Response) => {
  const user = await User.findById(req.userId).select("-password");

  res.json(user);
};

export const updateProfile = async (req: AuthRequest, res: Response) => {
  const { name } = req.body;

  let updateData: any = { name };

  if (req.file) {
    updateData.avatar = req.file.path;
  }

  const user = await User.findByIdAndUpdate(
    req.userId,
    updateData,
    { new: true }
  ).select("-password");

  res.json(user);
};

// ================= NOTIFICATIONS =================
// GET notifications
export const getNotifications = async (req: AuthRequest, res: Response) => {
  const user = await User.findById(req.userId);
  res.json(user?.notifications || []);
};

//UPDATE NOTIFICATIONS
export const updateNotifications = async (
  req: AuthRequest,
  res: Response
) => {
  const { emailNotifications, pushNotifications } = req.body;

  const user = await User.findByIdAndUpdate(
    req.userId,
    {
      emailNotifications,
      pushNotifications,
    },
    { new: true }
  );

  res.json(user);
};

// MARK AS READ
export const markNotificationsRead = async (req: AuthRequest, res: Response) => {
  await User.updateOne(
    { _id: req.userId },
    { $set: { "notifications.$[].read": true } }
  );

  const user = await User.findById(req.userId);

  res.json(user?.notifications || []);
};

// MARK ONE AS READ
export const markOneRead = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  await User.updateOne(
    { _id: req.userId, "notifications._id": id },
    { $set: { "notifications.$.read": true } }
  );

  const user = await User.findById(req.userId);
  res.json(user?.notifications);
};

// ARCHIVE ONE NOTIFICATION
export const archiveNotification = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  await User.updateOne(
    { _id: req.userId, "notifications._id": id },
    { $set: { "notifications.$.archived": true } }
  );

  const user = await User.findById(req.userId);

  res.json(user?.notifications);
};

// CLEAR ARCHIVED NOTIFICATIONS
export const clearArchived = async (req: AuthRequest, res: Response) => {
  await User.updateOne(
    { _id: req.userId },
    { $set: { notifications: [] } }
  );

  res.json([]);
};

// DELETE ONE NOTIFICATION
export const deleteNotification = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  await User.updateOne(
    { _id: req.userId },
    {
      $pull: {
        notifications: { _id: id },
      },
    }
  );

  const user = await User.findById(req.userId);

  res.json(user?.notifications);
};

// CLEAR ALL NOTIFICATIONS
export const clearNotifications = async (req: AuthRequest, res: Response) => {
  await User.updateOne(
    { _id: req.userId },
    {
      $set: { notifications: [] },
    }
  );

  res.json([]);
};

// ================= REMINDER =================
export const getReminder = async (req: AuthRequest, res: Response) => {
  const user = await User.findById(req.userId).select("reminder");

  res.json(user?.reminder || null);
};

// ================= THEME =================
export const updateTheme = async (req: AuthRequest, res: Response) => {
  const { theme } = req.body;

  const user = await User.findByIdAndUpdate(
    req.userId,
    { theme },
    { new: true }
  );

  res.json(user);
};

// ================= EXPORT DATA =================
export const exportUserData = async (
  req: AuthRequest,
  res: Response
) => {
  const user = await User.findById(req.userId).lean();

  res.json({
    user,
    message: "Export this as CSV/PDF on frontend",
  });
};

// ================= PASSWORD =================
export const changePassword = async (req: AuthRequest, res: Response) => {
  const { currentPassword, newPassword } = req.body;

  const user = await User.findById(req.userId);
  if (!user) return res.status(404).json({ message: "User not found" });

  const match = await bcrypt.compare(currentPassword, user.password);
  if (!match)
    return res.status(400).json({ message: "Wrong current password" });

  user.password = await bcrypt.hash(newPassword, 12);

  // 🔥 force logout everywhere
  user.tokenVersion += 1;

  await SecurityLog.create({
    userId: user._id.toString(),
    ip:
      (req.headers["x-forwarded-for"] as string) ||
      req.socket.remoteAddress ||
      "unknown",
    device: req.headers["user-agent"] || "unknown",
    action: "Password Changed",
    severity: "info",
  });

  await logActivity({
    userId: req.userId,

    type: "security_alert",

    title: "Password Changed",

    description:
      "User changed account password",

    severity: "warning",
  });

  await user.save();

  res.json({ message: "Password updated successfully" });
};

// ================= DELETE ACCOUNT =================
export const deleteAccount = async (
  req: AuthRequest,
  res: Response
) => {

  await logActivity({
    userId: req.userId,

    type: "security_alert",

    title: "Account Deleted",

    description:
      "User deleted account",

    severity: "danger",
  });

  await User.findByIdAndDelete(req.userId);

  res.json({ message: "Account deleted" });
};

export const getSecurityLogs = async (
  req: AuthRequest,
  res: Response
) => {
  const logs = await SecurityLog.find({
    userId: req.userId,
  })
    .sort({ createdAt: -1 })
    .limit(20);

  res.json(logs);
};