import { PlanId } from "./plans";

// config/paystack-plans.ts
export const PAYSTACK_PLAN_CODES: Record<PlanId, string | null> = {
  free: null, // no billing
  starter: process.env.PAYSTACK_PLAN_STARTER_CODE || null,
  pro: process.env.PAYSTACK_PLAN_PRO_CODE || null,
  enterprise: process.env.PAYSTACK_PLAN_ENTERPRISE_CODE || null,
};