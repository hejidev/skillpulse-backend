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

  plan:
  | "free"
  | "starter"
  | "pro"
  | "enterprise";

  billing: {
    paystackCustomerCode: string;
    paystackSubscriptionId: string;
    currentPeriodStart: Date;
    currentPeriodEnd: Date;
    cancelAtPeriodEnd: boolean;
    status:
    | "trialing"
    | "active"
    | "past_due"
    | "canceled"
    | "incomplete";
  };

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

  referralCode?: string;
  referredByCode?: string;
  referredByUserId?: mongoose.Types.ObjectId;

  referralStats?: {
    totalReferrals: number;
    successfulReferrals: number;
    pointsEarned: number;
  };

  wallet?: {
    points: number;      // SkillPoints / SkillCoins
    lastUpdatedAt?: Date;
  };

  twoFactorEnabled?: boolean;
  twoFactorSecret?: string; // if using TOTP apps like Google Authenticator
  twoFactorBackupCodes?: string[]; // optional
  twoFactorTempSecret?: string;
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

  plan: {
    type: String,
    enum: ["free", "starter", "pro", "enterprise"],
    default: "free",
  },

  billing: {
    paystackCustomerCode: { type: String },   // from Paystack
    paystackSubscriptionId: { type: String }, // from Paystack
    currentPeriodStart: Date,
    currentPeriodEnd: Date,
    cancelAtPeriodEnd: { type: Boolean, default: false },
    status: {
      type: String,
      enum: ["trialing", "active", "past_due", "canceled", "incomplete"],
      default: "trialing",
    },
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
  theme: {
    type: String,
    enum: ["light", "dark", "system"],
    default: "system",
  },

  trustedDevices: [
    {
      deviceHash: String,
      device: String,
      ip: String,
      lastUsed: { type: Date, default: Date.now },
    },
  ],

  referralCode: { type: String, unique: true, sparse: true },
  referredByCode: String,
  referredByUserId: { type: Schema.Types.ObjectId, ref: "User" },

  referralStats: {
    totalReferrals: { type: Number, default: 0 },
    successfulReferrals: { type: Number, default: 0 },
    pointsEarned: { type: Number, default: 0 },
  },

  wallet: {
    points: { type: Number, default: 0 },
    lastUpdatedAt: Date,
  },

  twoFactorEnabled: { type: Boolean, default: false },
  twoFactorSecret: { type: String }, // for TOTP
  twoFactorBackupCodes: [{ type: String }],
  twoFactorTempSecret: { type: [String], default: [] },
},
  {
    timestamps: true,
  }
);

export default mongoose.model<IUser>("User", userSchema);