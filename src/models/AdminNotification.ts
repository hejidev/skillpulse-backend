import mongoose from "mongoose";

const adminNotificationSchema =
  new mongoose.Schema(
    {
      title: {
        type: String,
        required: true,
      },

      message: {
        type: String,
        required: true,
      },

      category: {
        type: String,
        enum: [
          "auth",
          "user",
          "security",
          "system",
          "ticket",
          "message",
          "analytics",
          "cms",
          "ai",
          "billing",
          "achievement",
          "leaderboard",
        ],
      },

      severity: {
        type: String,
        enum: [
          "info",
          "success",
          "warning",
          "critical",
        ],
        default: "info",
      },

      targetRoles: [
        {
          type: String,
          enum: [
            "admin",
            "super_admin",
            "support",
            "user",
          ],
        },
      ],

      metadata: {
        type: Object,
        default: {},
      },

      readBy: [
        {
          userId: {
            type:
              mongoose.Schema.Types.ObjectId,
            ref: "User",
          },

          readAt: Date,
        },
      ],

      archivedBy: [
        {
          userId: {
            type:
              mongoose.Schema.Types.ObjectId,
            ref: "User",
          },

          archivedAt: Date,
        },
      ],

      expiresAt: Date,
    },
    {
      timestamps: true,
    }
  );

export default mongoose.model(
  "AdminNotification",
  adminNotificationSchema
);