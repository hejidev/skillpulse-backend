export type PlanId = "free" | "starter" | "pro" | "enterprise";

export const PLANS: Record<
  PlanId,
  {
    name: string;
    priceNGN: number;
    interval: "month";
    maxSkills: number | null;
    maxLevel: "Beginner" | "Intermediate" | "Advanced";
    monthlyHoursLimit: number | null;
  }
> = {
  free: {
    name: "Free",
    priceNGN: 0,
    interval: "month",
    maxSkills: 3,
    maxLevel: "Intermediate",
    monthlyHoursLimit: 10,
  },
  starter: {
    name: "Starter",
    priceNGN: 7000,
    interval: "month",
    maxSkills: 10,
    maxLevel: "Advanced",
    monthlyHoursLimit: 40,
  },
  pro: {
    name: "Pro",
    priceNGN: 31500,
    interval: "month",
    maxSkills: null, // unlimited
    maxLevel: "Advanced",
    monthlyHoursLimit: 200,
  },
  enterprise: {
    name: "Enterprise",
    priceNGN: 0,
    interval: "month",
    maxSkills: null,
    maxLevel: "Advanced",
    monthlyHoursLimit: null, // unlimited
  },
};