import mongoose, { Schema, Document } from "mongoose";

interface IUserNotification {
  message: string;

  type:
    | "info"
    | "success"
    | "warning"
    | "error";

  read: boolean;

  archived: boolean;

  createdAt: Date;
}

export interface IUser extends Document {
  name: string;
  email: string;
  password: string;

  isVerified: boolean;
  emailToken?: string;
  emailTokenExpires?: Date;

  otp?: string;
  otpExpires?: Date;
  otpAttempts: number;

  tokenVersion: number;
  lastIP?: string;

  role:
  "user"
  | "support"
  | "admin"
  | "super_admin";

  status:
  | "active"
  | "suspended"
  | "pending";

  permissions: string[];

  premium: boolean;

  isOnline: boolean;
  lastSeen?: Date;

  lastLoginAt?: Date;

  riskScore: number;

  securityFlags?: string[];

  avatar: string;

  streak: {
    current: number;
    longest: number;
    lastActiveDate?: Date;
    freezeCount: number;
  };

  highest: number;

  lastActiveDate?: Date;

  reminder: {
    lastRemindedAt?: Date;
    reminderCountToday: number;
    lastMessage?: string;
    unread: boolean;
  };

  notifications: IUserNotification[];

  emailNotifications: boolean;
  pushNotifications: boolean;
  theme: string;

  trustedDevices: {
    deviceHash: string;
    device: string;
    ip: string;
    lastUsed: Date;
  }[];
}

const userSchema = new Schema<IUser>({
  name: { type: String, required: true },

  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },

  isVerified: { type: Boolean, default: false },
  emailToken: String,
  emailTokenExpires: Date,

  otp: String,
  otpExpires: Date,
  otpAttempts: { type: Number, default: 0 },

  tokenVersion: { type: Number, default: 0 },
  lastIP: String,

  role: { type: String, enum: ["user", "admin", "support", "super_admin"], default: "user" },

  status: {
    type: String,
    enum: ["active", "suspended", "pending"],
    default: "active",
  },

  premium: {
  type: Boolean,
  default: false,
},

  permissions: [
    {
      type: String,
    },
  ],

  isOnline: {
    type: Boolean,
    default: false,
  },

  lastSeen: Date,

  lastLoginAt: Date,

  riskScore: {
    type: Number,
    default: 0,
  },

  securityFlags: [
    {
      type: String,
    },
  ],

  avatar: { type: String, default: "" },

  streak: {
    current: { type: Number, default: 0 },
    longest: { type: Number, default: 0 },
    lastActiveDate: Date,
    freezeCount: { type: Number, default: 1 },
  },

   highest: {
    type: Number,
    default: 0,
  },

  lastActiveDate: Date,

  reminder: {
    lastRemindedAt: Date,
    reminderCountToday: { type: Number, default: 0 },
    lastMessage: String,
    unread: { type: Boolean, default: false },
  },

  notifications: [
    {
      message: String,
      type: {
        type: String,
        enum: ["info", "success", "warning", "error"],
        default: "info",
      },
      read: { type: Boolean, default: false },
      archived: { type: Boolean, default: false },
      createdAt: { type: Date, default: Date.now },
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
    },
  ],
},
  {
    timestamps: true,
  }
);

export default mongoose.model<IUser>("User", userSchema);