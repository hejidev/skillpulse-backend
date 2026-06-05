import mongoose, { Schema, Document } from "mongoose";

export interface IActivity extends Document {
  userId?: mongoose.Types.ObjectId;

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

  severity:
    | "info"
    | "success"
    | "warning"
    | "danger";

  createdAt: Date;
}

const ActivitySchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },

    type: {
      type: String,
      required: true,
      enum: [
        "skill_created",
        "skill_deleted",
        "progress_added",
        "achievement_unlocked",
        "ticket_created",
        "ticket_replied",
        "login",
        "logout",
        "security_alert",
        "email_sent",
        "ai_used",
        "streak_updated",
        "xp_gained",
        "presence_update",
        "threat_detected",
      ],
    },

    title: String,

    description: String,

    severity: {
      type: String,
      enum: ["info", "success", "warning", "danger"],
      default: "info",
    },

    metadata: {
      ip: String,
      device: String,
      location: String,
      browser: String,
      os: String,
      xp: Number,
      streak: Number,
      aiTokens: Number,
      aiModel: String,
      skillName: String,
      ticketId: String,
      threatScore: Number,
    },
  },
  {
    timestamps: true,
  }
);

ActivitySchema.index({ createdAt: -1 });
ActivitySchema.index({ type: 1 });
ActivitySchema.index({ userId: 1 });
ActivitySchema.index({ severity: 1 });

export default mongoose.model("Activity", ActivitySchema);