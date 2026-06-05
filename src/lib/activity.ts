import Activity from "../models/Activity";
import { io } from "../server";

interface LogActivityParams {
  userId?: string;

  type:
    | "skill_created"
    | "skill_deleted"
    | "progress_added"
    | "achievement_unlocked"
    | "ticket_created"
    | "ticket_replied"
    | "login"
    | "logout"
    | "security_alert"
    | "email_sent"
    | "ai_used";

  title: string;

  description?: string;

  metadata?: any;

  severity?:
    | "info"
    | "success"
    | "warning"
    | "danger";
}

export const logActivity = async ({
  userId,
  type,
  title,
  description,
  metadata,
  severity = "info",
}: LogActivityParams) => {
  try {
    const activity = await Activity.create({
      userId,
      type,
      title,
      description,
      metadata,
      severity,
    });

    const populatedActivity =
      await Activity.findById(activity._id)
        .populate(
          "userId",
          "name email avatar"
        );

    // 🔥 EMIT TO ADMIN DASHBOARD
    io.to("admin-dashboard").emit(
      "admin:new-activity",
      populatedActivity
    );

    console.log(
      "✅ Activity emitted:",
      populatedActivity
    );

    return populatedActivity;
  } catch (err) {
    console.error(
      "❌ ACTIVITY LOGGER ERROR:",
      err
    );
  }
};