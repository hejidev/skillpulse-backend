// utils/referral.ts
import User from "../models/User";
import { randomBytes } from "crypto";

export async function generateUniqueReferralCode(): Promise<string> {
  // 8‑char uppercase code, e.g. A9F3K2QX
  const gen = () => randomBytes(4).toString("hex").toUpperCase();

  while (true) {
    const code = gen();
    const existing = await User.findOne({ referralCode: code }).select("_id");
    if (!existing) return code;
  }
}