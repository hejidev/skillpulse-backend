// models/BlockedIp.ts
import mongoose, { Schema, Document } from "mongoose";

export interface IBlockedIp extends Document {
  ip: string;
  reason?: string;
  createdBy?: mongoose.Types.ObjectId;
  createdAt: Date;
}

const blockedIpSchema = new Schema<IBlockedIp>(
  {
    ip: { type: String, required: true, unique: true },
    reason: String,
    createdBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export default mongoose.model<IBlockedIp>("BlockedIp", blockedIpSchema);