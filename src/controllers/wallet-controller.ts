// // controllers/wallet-controller.ts
import { Request, Response } from "express";
import { AuthRequest } from "../types/express";
import User from "../models/User";
import ReferralConfig from "../models/ReferralConfig";

import BillingEvent from "../models/BillingEvent";
import { PlanId } from "../config/plans";

// export const redeemPointsForPremium = async (req: AuthRequest, res: Response) => {
//   const user = await User.findById(req.userId);
//   if (!user) {
//     return res.status(404).json({ message: "User not found" });
//   }

//   const config = await ReferralConfig.findOne();
//   const cost = config?.pointsToPremium?.pointsPerMonth;
//   if (!cost || cost <= 0) {
//     return res.status(400).json({ message: "Redemption not configured" });
//   }

//   const currentPoints = user.wallet?.points || 0;
//   if (currentPoints < cost) {
//     return res.status(400).json({ message: "Not enough points" });
//   }

//   // 1) Deduct points
//   user.wallet = user.wallet || { points: 0 };
//   user.wallet.points = currentPoints - cost;
//   user.wallet.lastUpdatedAt = new Date();

//   // 2) Extend premium by 1 month
//   const now = new Date();
//   const currentEnd = user.billing?.currentPeriodEnd;
//   const base = currentEnd && currentEnd > now ? currentEnd : now;

//   const newEnd = new Date(base);
//   newEnd.setMonth(newEnd.getMonth() + 1);

//   user.premium = true;
//   // choose a plan to upgrade to; you can make this configurable later
//   user.plan = user.plan === "free" ? "starter" : user.plan;
//   user.billing = {
//     ...(user.billing || {}),
//     currentPeriodStart: now,
//     currentPeriodEnd: newEnd,
//     status: "active",
//   };

//   await user.save();

//   return res.json({
//     success: true,
//     message: `Redeemed ${cost} points for 1 month of premium`,
//     wallet: user.wallet,
//     billing: user.billing,
//   });
// };


export const redeemPointsForPremium = async (req: AuthRequest, res: Response) => {
  const user = await User.findById(req.userId);
  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  const config = await ReferralConfig.findOne();
  const cost = config?.pointsToPremium?.pointsPerMonth;
  if (!cost || cost <= 0) {
    return res.status(400).json({ message: "Redemption not configured" });
  }

  const currentPoints = user.wallet?.points || 0;
  if (currentPoints < cost) {
    return res.status(400).json({ message: "Not enough points" });
  }

  // 1) Deduct points
  user.wallet = user.wallet || { points: 0 };
  user.wallet.points = currentPoints - cost;
  user.wallet.lastUpdatedAt = new Date();

  // 2) Extend premium by 1 month
  const now = new Date();
  const currentEnd = user.billing?.currentPeriodEnd;
  const base = currentEnd && currentEnd > now ? currentEnd : now;

  const newEnd = new Date(base);
  newEnd.setMonth(newEnd.getMonth() + 1);

  const oldPlan = (user.plan || "free") as PlanId;
  const newPlan: PlanId = oldPlan === "free" ? "starter" : oldPlan;

  user.premium = true;
  user.plan = newPlan;
  user.billing = {
    ...(user.billing || {}),
    currentPeriodStart: now,
    currentPeriodEnd: newEnd,
    status: "active",
  };

  await user.save();

  // 3) Log BillingEvent so admin can see wallet-based upgrades
  await BillingEvent.create({
    userId: user._id,
    oldPlan,
    newPlan,
    amountDeltaNGN: 0,          // no direct cash impact
    reason: "wallet_redeem",
    meta: {
      source: "wallet",
      pointsSpent: cost,
    },
  });

  return res.json({
    success: true,
    message: `Redeemed ${cost} points for 1 month of premium`,
    wallet: user.wallet,
    billing: user.billing,
  });
};