import mongoose, {
  Schema,
  Document,
} from "mongoose";

export interface IMessage
  extends Document {

  title: string;

  content: string;

  type:
  | "broadcast"
  | "system"
  | "ticket_reply"
  | "alert";

  category:
  | "inbox"
  | "broadcast"
  | "system_alert"
  | "scheduled"
  | "archived";

  status:
  | "draft"
  | "pending"
  | "sent"
  | "failed"
  | "scheduled"
  | "acknowledged"
  | "resolved"
  | "escalated";

  priority:
  | "low"
  | "medium"
  | "high"
  | "critical";

  sender: {
    id: string;
    role:
    | "admin"
    | "system"
    | "super_admin";
  };

  recipients: {
    segment:
    | "all"
    | "users"
    | "admins"
    | "premium";

    userIds: string[];
  };

  readBy: string[];

  archivedBy: string[];

  openedBy: string[];

  clickedBy: string[];

  scheduledFor?: Date;

  deliveredAt?: Date;

  failedReason?: string;

  deliveryStats: {
    sent: number;
    delivered: number;
    failed: number;
    opened: number;
    clicked: number;
  };

  aiInsights: {
    openRate: number;
    threatLevel:
    | "safe"
    | "warning"
    | "critical";

    engagementScore: number;
  };

  parentMessageId?: string;

  createdAt: Date;
}

const messageSchema =
  new Schema<IMessage>(
    {
      title: String,

      content: String,

      type: {
        type: String,
        enum: [
          "broadcast",
          "system",
          "ticket_reply",
          "alert",
        ],
      },

      category: {
        type: String,
        enum: [
          "inbox",
          "broadcast",
          "system_alert",
          "scheduled",
          "archived",
        ],
        default: "broadcast",
      },

      status: {
        type: String,
        enum: [
          "draft",
          "pending",
          "sent",
          "failed",
          "scheduled",
          "acknowledged",
          "resolved",
          "escalated",
        ],
        default: "pending",
      },

    priority: {
    type: String,
    enum: [
      "low",
      "medium",
      "high",
      "critical",
    ],

    default: "low",
  },

    sender: {
    id: String,

    role: {
      type: String,
      enum: [
        "admin",
        "system",
        "super_admin",
      ],
    },
  },

    recipients: {
    segment: String,

    userIds: [String],
  },

    readBy: [String],

    archivedBy: [String],

    openedBy: [String],

    clickedBy: [String],

    scheduledFor: Date,

    deliveredAt: Date,

    failedReason: String,

    deliveryStats: {
    sent: {
      type: Number,
      default: 0,
    },

    delivered: {
      type: Number,
      default: 0,
    },

    failed: {
      type: Number,
      default: 0,
    },

    opened: {
      type: Number,
      default: 0,
    },

    clicked: {
      type: Number,
      default: 0,
    },
  },

    aiInsights: {
    openRate: {
      type: Number,
      default: 0,
    },

    threatLevel: {
      type: String,
      enum: [
        "safe",
        "warning",
        "critical",
      ],

      default: "safe",
    },

    engagementScore: {
      type: Number,
      default: 0,
    },
  },

    parentMessageId: String,
    },

{
  timestamps: true,
    }
  );

export default mongoose.model<IMessage>(
  "Message",
  messageSchema
);