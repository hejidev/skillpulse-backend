import mongoose, { Schema, Document } from "mongoose";

/* ================= MESSAGE TYPE ================= */
export interface TicketMessage {
  _id?: mongoose.Types.ObjectId;
  sender: "user" | "admin";
  message: string;
  createdAt: Date;
  deliveredAt?: Date;
  readAt?: Date | null;
}

/* ================= TICKET INTERFACE ================= */
export interface ITicket extends Document {
  user?: mongoose.Types.ObjectId | null;

  name: string;
  email: string;

  subject: string;
  message: string;

  status: "open" | "pending" | "resolved" | "closed";

  priority: "low" | "medium" | "high" | "urgent";

  category:
    | "bug"
    | "account"
    | "billing"
    | "feature"
    | "general"
    | "partnership";

  assignedTo?: mongoose.Types.ObjectId | null;

  messages: TicketMessage[];

  sla: {
    firstResponseAt: Date | null;
    resolvedAt: Date | null;
    breach: boolean;
  };

  tags: string[];

  createdAt: Date;
  updatedAt: Date;
}

/* ================= SCHEMA ================= */
const ticketSchema = new Schema<ITicket>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    name: { type: String, required: true },
    email: { type: String, required: true },
    subject: { type: String, required: true },
    message: { type: String, required: true },

    status: {
      type: String,
      enum: ["open", "pending", "resolved", "closed"],
      default: "open",
    },

    priority: {
      type: String,
      enum: ["low", "medium", "high", "urgent"],
      default: "medium",
    },

    category: {
      type: String,
      enum: [
        "bug",
        "account",
        "billing",
        "feature",
        "general",
        "partnership",
      ],
      default: "general",
    },

    assignedTo: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    /* ================= MESSAGES ================= */
    messages: [
      {
        _id: {
          type: Schema.Types.ObjectId,
          default: () => new mongoose.Types.ObjectId(),
        },

        sender: {
          type: String,
          enum: ["user", "admin"],
          required: true,
        },

        message: {
          type: String,
          required: true,
        },

        createdAt: {
          type: Date,
          default: Date.now,
        },

        deliveredAt: {
          type: Date,
          default: Date.now,
        },

        readAt: {
          type: Date,
          default: null,
        },
      },
    ],

    sla: {
      firstResponseAt: { type: Date, default: null },
      resolvedAt: { type: Date, default: null },
      breach: { type: Boolean, default: false },
    },

    tags: [{ type: String }],
  },
  {
    timestamps: true,
  }
);

export default mongoose.model<ITicket>("Ticket", ticketSchema);