// models/ReferralConfig.ts
import mongoose, { Schema, Document } from "mongoose";

export interface IReferralConfig extends Document {
  isEnabled: boolean;

  // Activation conditions
  requireEmailVerified: boolean;
  requireFirstSkill: boolean;
  requireFirstProgress: boolean;
  minProgressHours: number; // e.g. 1 hour

  // Rewards
  referrerPointsPerReferral: number;
  referredPointsPerReferral: number;

  referrerPremiumDaysPerReferral: number;
  referredPremiumDaysPerReferral: number;

  // Badge thresholds
  badgeTiers: {
    key: string;          // e.g. "referral_bronze"
    title: string;        // "Bronze Ambassador"
    description: string;
    referralsRequired: number;
    level: "bronze" | "silver" | "gold" | "legendary";
  }[];

  // Points -> premium conversion (for wallet system)
  pointsToPremium: {
    pointsPerMonth: number; // e.g. 500 points = 1 month
  };
}

const referralConfigSchema = new Schema<IReferralConfig>(
  {
    isEnabled: { type: Boolean, default: true },

    requireEmailVerified: { type: Boolean, default: true },
    requireFirstSkill: { type: Boolean, default: true },
    requireFirstProgress: { type: Boolean, default: true },
    minProgressHours: { type: Number, default: 1 },

    referrerPointsPerReferral: { type: Number, default: 50 },
    referredPointsPerReferral: { type: Number, default: 20 },

    referrerPremiumDaysPerReferral: { type: Number, default: 7 },
    referredPremiumDaysPerReferral: { type: Number, default: 4 },

    badgeTiers: [
      {
        key: { type: String },
        title: { type: String },
        description: { type: String },
        referralsRequired: { type: Number },
        level: {
          type: String,
          enum: ["bronze", "silver", "gold", "legendary"],
          default: "bronze",
        },
      },
    ],

    pointsToPremium: {
      pointsPerMonth: { type: Number, default: 500 },
    },
  },
  { timestamps: true }
);

export default mongoose.model<IReferralConfig>(
  "ReferralConfig",
  referralConfigSchema
);