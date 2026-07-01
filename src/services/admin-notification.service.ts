import AdminNotification from "../models/AdminNotification";
import { io } from "../server";

interface CreateAdminNotificationPayload {
  title: string;
  message: string;
  category:
    | "auth"
    | "user"
    | "security"
    | "system"
    | "ticket"
    | "message"
    | "analytics"
    | "cms"
    | "ai"
    | "billing"
    | "achievement"
    | "leaderboard";
  severity: "info" | "success" | "warning" | "critical";
  metadata?: Record<string, any>;
  roles?: Array<"admin" | "super_admin" | "support" | "user">;
}

export const createAdminNotification =
  async ({
    title,
    message,
    category,
    severity,
    metadata = {},
    roles = [
      "admin",
      "super_admin",
    ],
  }: any) => {

    const notification =
      await AdminNotification.create({
        title,
        message,
        category,
        severity,
        metadata,
        targetRoles: roles,
      });

    io.to("admin-notifications").emit("adminNotification", notification);

    return notification;
  };