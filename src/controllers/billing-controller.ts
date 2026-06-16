import { Request, Response } from "express";
import User from "../models/User";
import { AuthRequest } from "../types/express";
import { PlanId, PLANS } from "../config/plans";
import paystack from "../services/paystack-client";
import { getPaystackPlanCode } from "../services/paystack-plan-service";
import BillingEvent from "../models/BillingEvent";
import Plan, { IPlan } from "../models/Plan";

export const getPlans = async (req: Request, res: Response) => {
  try {
    const dbPlans: IPlan[] = await Plan.find({ active: true }).lean();

    // optional: still use PLANS for non-price limits
    const result = dbPlans.map((p) => {
      const cfg = PLANS[p.planId]; // for maxSkills, etc.
      return {
        id: p.planId,
        name: p.name,
        priceNGN: p.priceNGN,
        interval: "month",
        maxSkills: cfg.maxSkills,
        maxLevel: cfg.maxLevel,
        monthlyHoursLimit: cfg.monthlyHoursLimit,
      };
    });

    return res.json(result);
  } catch (err) {
    console.error("getPlans error:", err);
    return res.status(500).json({ message: "Failed to load plans" });
  }
};

export const getMySubscription = async (req: AuthRequest, res: Response) => {
  const user = await User.findById(req.userId).select(
    "plan billing premium email name"
  );

  if (!user) return res.status(404).json({ message: "User not found" });

  return res.json({
    plan: user.plan || "free",
    premium: user.premium,
    billing: user.billing,
    email: user.email,
    name: user.name,
  });
};

export const changePlan = async (req: AuthRequest, res: Response) => {
  const { planId } = req.body;

  if (!["free", "starter", "pro", "enterprise"].includes(planId)) {
    return res.status(400).json({ message: "Invalid plan" });
  }

  const user = await User.findById(req.userId);
  if (!user) return res.status(404).json({ message: "User not found" });

  // ⚠️ For now: just change plan directly (no payments).
  // Later: integrate Paystack + subscription verification here.
  user.plan = planId;
  user.premium = planId !== "free";
  await user.save();

  return res.json({
    success: true,
    plan: user.plan,
    premium: user.premium,
  });
};

export const initializeUpgrade = async (req: AuthRequest, res: Response) => {
  try {
    const { planId } = req.body as { planId: PlanId };

    if (!["starter", "pro"].includes(planId)) {
      return res.status(400).json({ message: "Invalid upgrade plan" });
    }

    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    const paystackPlanCode = await getPaystackPlanCode(planId);
    if (!paystackPlanCode) {
      return res.status(500).json({
        message: "Paystack plan not available for this tier",
      });
    }

    const response = await paystack.post("/transaction/initialize", {
      email: user.email,
      amount: PLANS[planId].priceNGN * 100,
      plan: paystackPlanCode,
      metadata: {
        userId: user._id.toString(),
        targetPlanId: planId,
      },
      callback_url: `${process.env.FRONTEND_URL}/company/billing/upgrade-complete`,
    });

    const { authorization_url, reference } = response.data.data;

    return res.json({
      authorizationUrl: authorization_url,
      reference,
    });
  } catch (err: any) {
    console.error("Initialize upgrade error:", err.response?.data || err);
    return res.status(500).json({ message: "Failed to initialize upgrade" });
  }
};


export const verifyUpgrade = async (req: Request, res: Response) => {
  try {
    const { reference } = req.query;
    console.log("VerifyUpgrade called with reference:", reference);
    if (!reference || typeof reference !== "string") {
      return res.status(400).json({ message: "Missing reference" });
    }

    const verifyRes = await paystack.get(`/transaction/verify/${reference}`);
    console.log("Paystack verify response:", verifyRes.data);
    const data = verifyRes.data.data;

    if (!data || data.status !== "success") {
      return res
        .status(400)
        .json({ message: "Payment not successful yet", status: data?.status });
    }

    const email = data.customer?.email;
    const metadata = data.metadata || {};
    const targetPlanId = metadata.targetPlanId as PlanId | undefined;

    if (!email || !targetPlanId) {
      return res
        .status(400)
        .json({ message: "Missing email or target plan from metadata" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Compute old/new plan before updating user
    const oldPlan = (user.plan || "free") as PlanId;
    const newPlan = targetPlanId;

    const oldPrice = PLANS[oldPlan].priceNGN;
    const newPrice = PLANS[newPlan].priceNGN;
    const amountDeltaNGN = newPrice - oldPrice; // positive for upgrade

    // Update user billing info
    user.billing = {
      ...user.billing,
      paystackCustomerCode: data.customer.customer_code,
      paystackSubscriptionId:
        data.subscription?.subscription_code || user.billing?.paystackSubscriptionId,
      status: "active",
      currentPeriodStart: new Date(data.paid_at),
      currentPeriodEnd: new Date(
        new Date(data.paid_at).setMonth(new Date(data.paid_at).getMonth() + 1)
      ),
    } as any;

    user.plan = newPlan;
    user.premium = newPlan !== "free";

    // Add in-app notification
    const amountNGN = PLANS[newPlan].priceNGN;
    const formattedAmount = new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
    }).format(amountNGN);

    user.notifications.push({
      message: `Payment successful! Your plan is now ${newPlan.toUpperCase()} (${formattedAmount} per month).`,
      type: "success",
      read: false,
      archived: false,
      createdAt: new Date(),
    });

    await user.save();

    // Log revenue impact
    await BillingEvent.create({
      userId: user._id,
      oldPlan,
      newPlan,
      amountDeltaNGN,
      reason: "user_upgrade",
      meta: {
        source: "paystack",
      },
    });

    return res.json({
      success: true,
      plan: user.plan,
      premium: user.premium,
      billing: user.billing,
    });
  } catch (err: any) {
    console.error("Verify upgrade error:", err.response?.data || err);
    return res.status(500).json({ message: "Failed to verify payment" });
  }
};