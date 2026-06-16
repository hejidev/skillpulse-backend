import mongoose, { Schema, Document } from "mongoose";
import { PlanId } from "../config/plans"; 


export interface IBillingEvent extends Document {
  userId: mongoose.Types.ObjectId;
  oldPlan: PlanId;
  newPlan: PlanId;
  amountDeltaNGN: number; // + for upgrade, - for downgrade
  reason: "admin_change" | "user_change" | "system" | "user_upgrade" | "wallet_redeem";
  meta?: {
  source?: "paystack" | "wallet" | "admin";
  pointsSpent?: number;
};
  createdAt: Date;
}

const billingEventSchema = new Schema<IBillingEvent>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    oldPlan: { type: String, required: true },
    newPlan: { type: String, required: true },
    amountDeltaNGN: { type: Number, required: true },
    reason: {
      type: String,
      enum: ["admin_change", "user_change", "system", "user_upgrade", "wallet_redeem"],
      required: true,
      default: "admin_change",
    },
    meta: {
      source: {
        type: String,
        enum: ["paystack", "wallet", "admin"],
      },
      pointsSpent: { type: Number },
    },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export default mongoose.model<IBillingEvent>("BillingEvent", billingEventSchema);