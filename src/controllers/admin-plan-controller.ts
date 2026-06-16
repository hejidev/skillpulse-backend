// // admin-plan-controller.ts
// import { Response } from "express";
// import Plan from "../models/Plan";
// import { AuthRequest } from "../types/express";

// export const listPlans = async (req: AuthRequest, res: Response) => {
//   const plans = await Plan.find().lean();
//   return res.json(plans);
// };

// export const upsertPlan = async (req: AuthRequest, res: Response) => {
//   const { planId, name, priceNGN, active } = req.body;
//   if (!planId || !name) {
//     return res.status(400).json({ message: "planId and name required" });
//   }

//   const plan = await Plan.findOneAndUpdate(
//     { planId },
//     { name, priceNGN, active },
//     { new: true, upsert: true }
//   );
//   return res.json({ success: true, plan });
// };