// models/SystemSettings.ts
import mongoose, { Schema, Document } from "mongoose";

export interface ISystemSettings extends Document {
  appName: string;
  apiBaseUrl: string;

  maintenanceMode: boolean;
  debugMode: boolean;

  enforce2FA: boolean;
  trustedDevicesLock: boolean;
  jwtRotationEnabled: boolean;
  sessionMaxAgeMinutes: number;

  openAIApiKey?: string;
  smtpConnectionString?: string;
  webhookUrl?: string;

  defaultTheme: "light" | "dark";
  compactLayout: boolean;
  reduceAnimations: boolean;
  highContrast: boolean;

  notifyOnPlanChange: boolean;
  notifyOnSecurityEvents: boolean;

  updatedBy?: mongoose.Types.ObjectId;
  updatedAt: Date;
}

const systemSettingsSchema = new Schema<ISystemSettings>(
  {
    appName: { type: String, default: "SkillPulse" },
    apiBaseUrl: { type: String, default: "" },

    maintenanceMode: { type: Boolean, default: false },
    debugMode: { type: Boolean, default: false },

    enforce2FA: { type: Boolean, default: false },
    trustedDevicesLock: { type: Boolean, default: false },
    jwtRotationEnabled: { type: Boolean, default: false },
    sessionMaxAgeMinutes: { type: Number, default: 60 * 24 }, // 1 day

    openAIApiKey: { type: String },
    smtpConnectionString: { type: String },
    webhookUrl: { type: String },

    defaultTheme: { type: String, enum: ["light", "dark"], default: "dark" },
    compactLayout: { type: Boolean, default: false },
    reduceAnimations: { type: Boolean, default: false },
    highContrast: { type: Boolean, default: false },

    notifyOnPlanChange: { type: Boolean, default: true },
    notifyOnSecurityEvents: { type: Boolean, default: true },

    updatedBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

export default mongoose.model<ISystemSettings>(
  "SystemSettings",
  systemSettingsSchema
);