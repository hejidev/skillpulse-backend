import AdminNotification from "../models/AdminNotification";
import { io } from "../server";

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

    io.to("admin-notifications")
      .emit(
        "admin-notification",
        notification
      );

    return notification;
  };