// models/EmailLog.ts
import mongoose from "mongoose";

const EmailLogSchema = new mongoose.Schema({
  emailId: String,
  to: String,
  subject: String,
  status: String, // sent, delivered, opened, bounced
  error: String,
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.model("EmailLog", EmailLogSchema);