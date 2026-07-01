import { Request, Response } from "express";
import User from "../models/User";
import Skill from "../models/Skill";
import Progress from "../models/Progress";
import { PlanId, PLANS } from "../config/plans";
import { AuthRequest } from "../types/express";
import { isValidObjectId } from "mongoose";
import BillingEvent from "../models/BillingEvent";
import { notifyPlanChange } from "../services/email-service";
import Plan, { IPlan } from "../models/Plan";
import { createAdminNotification } from "../services/admin-notification.service";

export const getAdminBillingOverview = async (req: AuthRequest, res: Response) => {
  try {
    const totalsByPlan: Record<PlanId, number> = {
      free: 0,
      starter: 0,
      pro: 0,
      enterprise: 0,
    };

    const users = await User.find().select("plan");
    users.forEach((u) => {
      const plan = (u.plan || "free") as PlanId;
      if (totalsByPlan[plan] === undefined) return;
      totalsByPlan[plan] += 1;
    });

    // Revenue impact for current month
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const eventsAgg = await BillingEvent.aggregate([
      {
        $match: {
          createdAt: { $gte: monthStart },
        },
      },
      {
        $group: {
          _id: null,
          totalDelta: { $sum: "$amountDeltaNGN" },
          upgrades: {
            $sum: {
              $cond: [{ $gt: ["$amountDeltaNGN", 0] }, "$amountDeltaNGN", 0],
            },
          },
          downgrades: {
            $sum: {
              $cond: [{ $lt: ["$amountDeltaNGN", 0] }, "$amountDeltaNGN", 0],
            },
          },
        },
      },
    ]);

    const revenueStats = eventsAgg[0] || {
      totalDelta: 0,
      upgrades: 0,
      downgrades: 0,
    };

    return res.json({
      totalsByPlan,
      revenueImpactThisMonth: {
        totalDeltaNGN: revenueStats.totalDelta,
        upgradesNGN: revenueStats.upgrades,
        downgradesNGN: revenueStats.downgrades,
      },
    });
  } catch (err) {
    console.error("Admin billing overview error:", err);
    return res.status(500).json({ message: "Failed to load overview" });
  }
};

export const getAdminBillingUsers = async (req: AuthRequest, res: Response) => {
  try {
    const users = await User.find()
      .select("name email plan billing")
      .lean();

    // Get totalSkills and monthHours
    const userIds = users.map((u) => u._id);

    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const skillsAgg = await Skill.aggregate([
      { $match: { userId: { $in: userIds } } },
      {
        $group: {
          _id: "$userId",
          totalSkills: { $sum: 1 },
        },
      },
    ]);

    const progressAgg = await Progress.aggregate([
      {
        $match: {
          userId: { $in: userIds },
          createdAt: { $gte: monthStart },
        },
      },
      {
        $group: {
          _id: "$userId",
          monthHours: { $sum: "$hours" },
        },
      },
    ]);

    const skillsMap = new Map(
      skillsAgg.map((s: any) => [s._id.toString(), s.totalSkills as number])
    );
    const progressMap = new Map(
      progressAgg.map((p: any) => [p._id.toString(), p.monthHours as number])
    );

    const result = users.map((u: any) => ({
      _id: u._id,
      name: u.name,
      email: u.email,
      plan: u.plan || "free",
      totalSkills: skillsMap.get(u._id.toString()) || 0,
      monthHours: progressMap.get(u._id.toString()) || 0,
      billingStatus: u.billing?.status || "unknown",
    }));

    return res.json(result);
  } catch (err) {
    console.error("Admin billing users error:", err);
    return res.status(500).json({ message: "Failed to load users" });
  }
};

export const getAdminBillingEvents = async (req: AuthRequest, res: Response) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 50;
    const skip = (page - 1) * limit;

    // Fetch events with user info
    const events = await BillingEvent.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("userId", "name email plan") // make sure BillingEvent.userId ref: 'User'
      .lean();

    const total = await BillingEvent.countDocuments();

    const result = events.map((e: any) => ({
      id: e._id,
      userId: e.userId?._id,
      userName: e.userId?.name || "Unknown",
      userEmail: e.userId?.email || "",
      oldPlan: e.oldPlan,
      newPlan: e.newPlan,
      amountDeltaNGN: e.amountDeltaNGN,
      reason: e.reason,
      meta: e.meta || {},
      createdAt: e.createdAt,
    }));

    return res.json({
      success: true,
      events: result,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    console.error("Admin billing events error:", err);
    return res.status(500).json({ message: "Failed to load billing events" });
  }
};

export const adminChangeUserPlan = async (req: AuthRequest, res: Response) => {
  try {
    const { userId } = req.params;
    const { planId } = req.body as { planId: PlanId };

    if (!isValidObjectId(userId)) {
      return res.status(400).json({ message: "Invalid user id" });
    }

    if (!["free", "starter", "pro", "enterprise"].includes(planId)) {
      return res.status(400).json({ message: "Invalid plan" });
    }

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    const oldPlan = (user.plan || "free") as PlanId;
    const newPlan = planId as PlanId;

    const oldPrice = PLANS[oldPlan].priceNGN;
    const newPrice = PLANS[newPlan].priceNGN;

    const amountDeltaNGN = newPrice - oldPrice; // negative when downgrading

    user.plan = newPlan;
    user.premium = newPlan !== "free";
    await user.save();

    // Log the revenue impact
    await BillingEvent.create({
      userId: user._id,
      oldPlan,
      newPlan,
      amountDeltaNGN,
      reason: "admin_change",
      meta: {
        source: "admin",
      },
    });

    await createAdminNotification({
      title: "Plan changed",
      message: `Admin changed plan for ${user.email} from ${oldPlan} to ${newPlan}.`,
      category: "billing",
      severity: "info",
      roles: ["admin", "super_admin"],
      metadata: { userId: user._id, oldPlan, newPlan, amountDeltaNGN },
    });

    // Send email notifications
    try {
      await notifyPlanChange(user, oldPlan, newPlan, amountDeltaNGN);
    } catch (emailErr) {
      console.error("Plan change email error:", emailErr);
      // don’t fail the API because of email
    }

    return res.json({
      success: true,
      userId: user._id,
      plan: user.plan,
      premium: user.premium,
      amountDeltaNGN,
    });
  } catch (err) {
    console.error("Admin change user plan error:", err);
    return res.status(500).json({ message: "Failed to change user plan" });
  }
};

export const listPlans = async (req: AuthRequest, res: Response) => {
  try {
    const plans: IPlan[] = await Plan.find().lean();
    return res.json(plans);
  } catch (err) {
    console.error("List plans error:", err);
    return res.status(500).json({ message: "Failed to load plans" });
  }
};

export const upsertPlan = async (req: AuthRequest, res: Response) => {
  try {
    const { planId, name, priceNGN, active } = req.body as {
      planId: string;
      name: string;
      priceNGN: number;
      active?: boolean;
    };

    if (!planId || !name) {
      return res.status(400).json({ message: "planId and name required" });
    }

    const plan = await Plan.findOneAndUpdate(
      { planId },
      { name, priceNGN, active },
      { new: true, upsert: true }
    );

    return res.json({ success: true, plan });
  } catch (err) {
    console.error("Upsert plan error:", err);
    return res.status(500).json({ message: "Failed to save plan" });
  }
};

export const adminCreateBillingEvent = async (req: AuthRequest, res: Response) => {
  try {
    const { userId, amountDeltaNGN, reason, note } = req.body;

    if (!isValidObjectId(userId)) {
      return res.status(400).json({ message: "Invalid user id" });
    }

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    const currentPlan = (user.plan || "free") as PlanId;

    const event = await BillingEvent.create({
      userId: user._id,
      oldPlan: currentPlan,
      newPlan: currentPlan, // no plan change, just adjustment
      amountDeltaNGN,
      reason, // could be "system" or a new "manual_adjustment" reason
      meta: {
        source: "admin",
        // optionally extend meta with note / adjustmentType
      },
    });

    await createAdminNotification({
      title: "Billing adjustment",
      message: `Manual billing adjustment of ₦${amountDeltaNGN} for ${user.email} on plan ${currentPlan}.`,
      category: "billing",
      severity: "info",
      roles: ["admin", "super_admin"],
      metadata: { userId: user._id, plan: currentPlan, amountDeltaNGN, reason, note },
    });

    return res.json({ success: true, event });
  } catch (err) {
    console.error("Admin create billing event error:", err);
    return res.status(500).json({ message: "Failed to create billing event" });
  }
};