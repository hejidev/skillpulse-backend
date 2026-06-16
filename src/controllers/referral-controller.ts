// controllers/referral-controller.ts
import { Response } from "express";
import { AuthRequest } from "../types/express";
import User from "../models/User";
import Referral from "../models/Referral";

export const getMyReferralOverview = async (
  req: AuthRequest,
  res: Response
) => {
  const user = await User.findById(req.userId).select(
    "name email referralCode referralStats wallet"
  );
  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  const referrals = await Referral.find({
    referrerId: user._id,
  })
    .populate("referredUserId", "name email")
    .sort({ createdAt: -1 });

  return res.json({
    user: {
      name: user.name,
      email: user.email,
      referralCode: user.referralCode,
      referralStats: user.referralStats,
      wallet: user.wallet,
    },
    referrals: referrals.map((r) => ({
      id: r._id,
      status: r.status,
      activationEvent: r.activationEvent,
      createdAt: r.createdAt,
      referredUser: (r as any).referredUserId
        ? {
            name: (r as any).referredUserId.name,
            email: (r as any).referredUserId.email,
          }
        : null,
    })),
  });
};