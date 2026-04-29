// models/SecurityLog.ts

import mongoose from "mongoose";

const securityLogSchema = new mongoose.Schema({
  userId: String,
  ip: String,
  device: String,
  action: String,
  deviceHash: String,

  severity: {
    type: String,
    enum: ["info", "warning", "danger"],
    default: "info",
  },

  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model("SecurityLog", securityLogSchema);