// models/Plan.ts
import mongoose, { Schema, Document } from "mongoose";
import { PlanId } from "../config/plans";

export interface IPlan extends Document {
  planId: PlanId; // "free" | "starter" | "pro" | "enterprise"
  name: string;
  priceNGN: number;
  active: boolean;
}

const planSchema = new Schema<IPlan>(
  {
    planId: { type: String, unique: true, required: true },
    name: { type: String, required: true },
    priceNGN: { type: Number, required: true },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.model<IPlan>("Plan", planSchema);