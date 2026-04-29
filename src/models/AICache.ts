import mongoose, { Schema, Document } from "mongoose";

export interface IAICache extends Document {
  userId: mongoose.Types.ObjectId;
  skillId: mongoose.Types.ObjectId;
  hash: string;
  message: string;
  createdAt: Date;
}

const aiCacheSchema = new Schema<IAICache>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", index: true },
    skillId: { type: Schema.Types.ObjectId, ref: "Skill", index: true },
    hash: { type: String, index: true },
    message: String,
  },
  { timestamps: true }
);

export default mongoose.model<IAICache>("AICache", aiCacheSchema);