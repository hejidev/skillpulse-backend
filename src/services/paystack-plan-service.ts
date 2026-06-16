import paystack from "./paystack-client";
import { PLANS, PlanId } from "../config/plans";
import PaystackPlan from "../models/PaystackPlan";

export const syncPaystackPlans = async () => {
  const planIds: PlanId[] = ["starter", "pro", "enterprise"]; // skip "free"

  for (const planId of planIds) {
    const local = PLANS[planId];

    // Ignore if price is 0 (e.g. free/enterprise internal)
    if (!local || local.priceNGN <= 0) continue;

    // Check if we already have a plan stored
    let existing = await PaystackPlan.findOne({ planId });

    if (existing) {
      // Optionally you could update amount/interval via Paystack's update endpoint
      continue;
    }

    // Create plan on Paystack
    const res = await paystack.post("/plan", {
      name: `${local.name} (${planId})`,
      amount: local.priceNGN * 100, // Paystack uses kobo
      interval: "monthly", // you use month in PLANS
      currency: "NGN",
    });

    const data = res.data.data;

    existing = await PaystackPlan.create({
      planId,
      paystackPlanCode: data.plan_code,
      paystackPlanId: data.id,
    });

    console.log("Created Paystack plan:", planId, existing.paystackPlanCode);
  }
};

// Helper to fetch code by PlanId
export const getPaystackPlanCode = async (planId: PlanId) => {
  const doc = await PaystackPlan.findOne({ planId });
  return doc?.paystackPlanCode || null;
};