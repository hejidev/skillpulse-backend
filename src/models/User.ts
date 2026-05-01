import mongoose, { Schema, Document } from "mongoose";

export interface IUser extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  email: string;
  password: string;

  isVerified: boolean;
  emailToken?: string;
  emailTokenExpires?: Date;

  otp?: string;
  otpExpires?: Date;
  otpAttempts?: number;

  tokenVersion: number;
  lastIP?: string;

  role: "user" | "admin";

  avatar: string;

  streak: {
    current: number;
    longest: number;
    lastActiveDate: Date;
    freezeCount: number;
  };

  reminder: {
    lastRemindedAt?: Date;
    reminderCountToday: number;
    lastMessage?: string;
    unread?: boolean;
  };

  notifications: {
    message: string;
    read: boolean;
    createdAt: Date;
  }[];

  emailNotifications: boolean;
  pushNotifications: boolean;
  theme: string;

  trustedDevices: {
    deviceHash: String,
    device: String,
    ip: String,
    lastUsed: Date
  }[];
}

const userSchema = new Schema<IUser>({
  name: { type: String, required: true },

  email: {
    type: String,
    required: true,
    unique: true,
  },

  password: { type: String, required: true },

  // ✅ ADD THIS BLOCK
  isVerified: { type: Boolean, default: false },
  emailToken: { type: String },
  emailTokenExpires: { type: Date }, // 1 hour

  otp: { type: String },
  otpExpires: { type: Date },
  otpAttempts: { type: Number, default: 0 },

  tokenVersion: { type: Number, default: 0 },
  lastIP: { type: String },

  role: {
    type: String,
    enum: ["user", "admin"],
    default: "user",
  },

  avatar: { type: String, default: "" },

  streak: {
    current: { type: Number, default: 0 },
    longest: { type: Number, default: 0 },
    lastActiveDate: { type: Date },
    freezeCount: { type: Number, default: 1 }, // 🔥 streak freeze tokens
  },

  reminder: {
    lastRemindedAt: { type: Date },
    reminderCountToday: { type: Number, default: 0 },
    lastMessage: { type: String },
    unread: { type: Boolean, default: false },
  },

  notifications: [
    {
      _id: Object,
      message: String,
      type: {
        type: String,
        enum: ["info", "success", "warning", "error"],
        default: "info",
      },
      read: {
        type: Boolean,
        default: false,
      },
      archived: {
        type: Boolean,
        default: false,
      },
      createdAt: {
        type: Date,
        default: Date.now,
      },
    },
  ],

  emailNotifications: { type: Boolean, default: true },
  pushNotifications: { type: Boolean, default: false },
  theme: { type: String, default: "dark" },

  trustedDevices: [
    {
      deviceHash: String,
      device: String,
      ip: String,
      lastUsed: { type: Date, default: Date.now },
    }
  ],

});

export default mongoose.model<IUser>("User", userSchema);