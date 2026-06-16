import { PLANS, PlanId } from "../config/plans";
import { IUser } from "../models/User";

export const getUserPlanConfig = (user: IUser) => {
  const planId = (user.plan || "free") as PlanId;
  return PLANS[planId] || PLANS.free;
};