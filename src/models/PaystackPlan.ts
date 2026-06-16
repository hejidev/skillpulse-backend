import mongoose, { Schema, Document } from "mongoose";
import { PlanId } from "../config/plans";

export interface IPaystackPlan extends Document {
  planId: PlanId;          // "starter" | "pro" | ...
  paystackPlanCode: string; // e.g. "PLN_abc123"
  paystackPlanId: number;   // numeric id from Paystack
}

const paystackPlanSchema = new Schema<IPaystackPlan>(
  {
    planId: { type: String, required: true, unique: true },
    paystackPlanCode: { type: String, required: true },
    paystackPlanId: { type: Number, required: true },
  },
  { timestamps: true }
);

export default mongoose.model<IPaystackPlan>("PaystackPlan", paystackPlanSchema);