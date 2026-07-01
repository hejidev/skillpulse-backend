// models/AdminSecurityAction.ts
import mongoose, { Schema, Document } from "mongoose";

export interface IAdminSecurityAction extends Document {
  adminId: mongoose.Types.ObjectId;
  type: "BLOCK_IP" | "UNBLOCK_IP" | "TRUST_DEVICE" | "REVOKE_DEVICE" | "EMERGENCY_LOCKDOWN";
  targetIp?: string;
  targetUserId?: mongoose.Types.ObjectId;
  targetDeviceHash?: string;
  reason?: string;
  createdAt: Date;
}

const adminSecurityActionSchema = new Schema<IAdminSecurityAction>(
  {
    adminId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    type: {
      type: String,
      enum: [
        "BLOCK_IP",
        "UNBLOCK_IP",
        "TRUST_DEVICE",
        "REVOKE_DEVICE",
        "EMERGENCY_LOCKDOWN",
        // any others you use
      ],
      required: true,
    },
    targetIp: String,
    targetUserId: { type: Schema.Types.ObjectId, ref: "User" },
    targetDeviceHash: String,
    reason: String,
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export default mongoose.model<IAdminSecurityAction>(
  "AdminSecurityAction",
  adminSecurityActionSchema
);