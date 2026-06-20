// models/SecurityLog.ts
import mongoose, { Schema, Document } from "mongoose";

export interface ISecurityLog extends Document {
  userId?: string;
  ip?: string;
  device?: string;
  action: string;
  deviceHash?: string;
  severity: "info" | "warning" | "danger";
  createdAt: Date;
}

const securityLogSchema = new Schema<ISecurityLog>({
  userId: String,
  ip: String,
  device: String,
  action: { type: String, required: true },
  deviceHash: String,
  severity: {
    type: String,
    enum: ["info", "warning", "danger"],
    default: "info",
  },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model<ISecurityLog>("SecurityLog", securityLogSchema);