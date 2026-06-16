// services/referral-service.ts
import Referral, { IReferral } from "../models/Referral";
import ReferralConfig, { IReferralConfig } from "../models/ReferralConfig";
import User from "../models/User";
import { io } from "../server";

export async function checkReferralActivation(
  userId: string,
  event: "first_skill" | "first_progress",
  eventPayload?: { hours?: number }
) {
  const user = await User.findById(userId);
  if (!user?.referredByCode) return;

  const config = await ReferralConfig.findOne();
  if (!config?.isEnabled) return;

  // find referral record
  const referral = await Referral.findOne({
    referredUserId: user._id,
    status: { $in: ["signed_up", "activated"] },
  });

  if (!referral || referral.status === "rewarded") return;

  // Check activation conditions based on config
  if (config.requireEmailVerified && !user.isVerified) return;

  if (event === "first_skill" && !config.requireFirstProgress) {
    await markReferralActivated(referral, "first_skill");
    await rewardReferral(referral, config);
  }

  if (event === "first_progress") {
    if (
      config.requireFirstProgress &&
      (eventPayload?.hours || 0) < config.minProgressHours
    ) {
      return;
    }
    await markReferralActivated(referral, "first_progress");
    await rewardReferral(referral, config);
  }
}

async function markReferralActivated(referral: IReferral, activationEvent: string) {
  referral.status = "activated";
  referral.activationEvent = activationEvent;
  await referral.save();
}

async function rewardReferral(referral: IReferral, config: IReferralConfig) {
  if (referral.status === "rewarded") return;

  const referrer = await User.findById(referral.referrerId);
  const referred = referral.referredUserId
    ? await User.findById(referral.referredUserId)
    : null;

  if (!referrer) return;

  const refPoints = config.referrerPointsPerReferral || 0;
  const referredPoints = config.referredPointsPerReferral || 0;

  if (refPoints > 0) {
  referrer.wallet = referrer.wallet || { points: 0 };
  referrer.wallet.points += refPoints;
  referrer.wallet.lastUpdatedAt = new Date();

  referrer.referralStats = referrer.referralStats || {
    totalReferrals: 0,
    successfulReferrals: 0,
    pointsEarned: 0,
  };
  referrer.referralStats.totalReferrals += 1;      // 👈 add this
  referrer.referralStats.successfulReferrals += 1;
  referrer.referralStats.pointsEarned += refPoints;
}

  // OPTIONAL: premium days extension goes here

  // 🔔 Notification for referrer
  const refNotification = {
    message: `🎁 Referral reward: you earned ${refPoints} SkillPoints`,
    type: "success" as const,
    read: false,
    archived: false,
    createdAt: new Date(),
  };
  referrer.notifications.unshift(refNotification);

  await referrer.save();

  // Optional realtime push
  if (referrer._id) {
    io.to(referrer._id.toString()).emit("notification", refNotification);
  }

  // Referred user reward
  if (referred && referredPoints > 0) {
    referred.wallet = referred.wallet || { points: 0 };
    referred.wallet.points += referredPoints;
    referred.wallet.lastUpdatedAt = new Date();

    const referredNotification = {
      message: `🎉 Welcome! You earned ${referredPoints} SkillPoints for joining via referral.`,
      type: "success" as const,
      read: false,
      archived: false,
      createdAt: new Date(),
    };
    referred.notifications.unshift(referredNotification);

    await referred.save();

    io.to(referred._id.toString()).emit("notification", referredNotification);
  }

  referral.status = "rewarded";
  await referral.save();

  // TODO: badge tiers & achievements later
}