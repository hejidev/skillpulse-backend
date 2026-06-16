// models/Subscriber.ts
import mongoose, { Schema, Document } from "mongoose";

export interface ISubscriber extends Document {
  email: string;
  name?: string;
  source: "footer" | "signup" | "landing" | "other";
  status: "pending" | "confirmed" | "unsubscribed";
  tags: string[];
  lastEmailAt?: Date;
  unsubscribedAt?: Date;
  verificationToken?: string;
  createdAt?: Date;
  updatedAt?: Date; 
}

const subscriberSchema = new Schema<ISubscriber>(
  {
    email: { type: String, required: true, unique: true },
    name: String,
    source: {
      type: String,
      enum: ["footer", "signup", "landing", "other"],
      default: "footer",
    },
    status: {
      type: String,
      enum: ["pending", "confirmed", "unsubscribed"],
      default: "pending",
    },
    tags: [{ type: String }],
    lastEmailAt: Date,
    unsubscribedAt: Date,
    verificationToken: String, // for double‑opt‑in
  },
  { timestamps: true }
);

export default mongoose.model<ISubscriber>("Subscriber", subscriberSchema);