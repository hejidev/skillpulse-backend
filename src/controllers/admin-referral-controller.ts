// controllers/admin-referral-controller.ts
import { Request, Response } from "express";
import ReferralConfig from "../models/ReferralConfig";
import Referral from "../models/Referral";
import User from "../models/User";
import { generateUniqueReferralCode } from "../utils/referral";

export const getReferralConfig = async (req: Request, res: Response) => {
  const config = await ReferralConfig.findOne();
  if (!config) {
    // seed a default config if none exists
    const created = await ReferralConfig.create({});
    return res.json(created);
  }
  return res.json(config);
};

export const updateReferralConfig = async (req: Request, res: Response) => {
  const payload = req.body;
  // basic safety: avoid setting unknown fields by whitelisting
  const update: any = {};

  if (typeof payload.isEnabled === "boolean") {
    update.isEnabled = payload.isEnabled;
  }

  if (typeof payload.requireEmailVerified === "boolean") {
    update.requireEmailVerified = payload.requireEmailVerified;
  }
  if (typeof payload.requireFirstSkill === "boolean") {
    update.requireFirstSkill = payload.requireFirstSkill;
  }
  if (typeof payload.requireFirstProgress === "boolean") {
    update.requireFirstProgress = payload.requireFirstProgress;
  }
  if (typeof payload.minProgressHours === "number") {
    update.minProgressHours = payload.minProgressHours;
  }

  if (typeof payload.referrerPointsPerReferral === "number") {
    update.referrerPointsPerReferral = payload.referrerPointsPerReferral;
  }
  if (typeof payload.referredPointsPerReferral === "number") {
    update.referredPointsPerReferral = payload.referredPointsPerReferral;
  }

  if (typeof payload.referrerPremiumDaysPerReferral === "number") {
    update.referrerPremiumDaysPerReferral =
      payload.referrerPremiumDaysPerReferral;
  }
  if (typeof payload.referredPremiumDaysPerReferral === "number") {
    update.referredPremiumDaysPerReferral =
      payload.referredPremiumDaysPerReferral;
  }

  if (payload.pointsToPremium?.pointsPerMonth) {
    update.pointsToPremium = {
      pointsPerMonth: payload.pointsToPremium.pointsPerMonth,
    };
  }

  if (Array.isArray(payload.badgeTiers)) {
    update.badgeTiers = payload.badgeTiers;
  }

  const config = await ReferralConfig.findOneAndUpdate({}, update, {
    new: true,
    upsert: true,
  });

  return res.json(config);
};

export const getReferralStats = async (req: Request, res: Response) => {
  const totalReferrals = await Referral.countDocuments();
  const signedUp = await Referral.countDocuments({ status: "signed_up" });
  const activated = await Referral.countDocuments({ status: "activated" });
  const rewarded = await Referral.countDocuments({ status: "rewarded" });

  const topReferrers = await User.find({ "referralStats.successfulReferrals": { $gt: 0 } })
    .sort({ "referralStats.successfulReferrals": -1 })
    .limit(10)
    .select("name email referralStats referralCode");

  return res.json({
    totals: { totalReferrals, signedUp, activated, rewarded },
    topReferrers,
  });
};

export const backfillReferralCodes = async (req: Request, res: Response) => {
  const users = await User.find({
    $or: [{ referralCode: { $exists: false } }, { referralCode: null }],
  }).select("_id email referralCode");

  let updated = 0;

  for (const user of users) {
    const code = await generateUniqueReferralCode();
    user.referralCode = code;
    await user.save();
    updated += 1;
  }

  return res.json({
    message: "Backfill completed",
    updated,
  });
};