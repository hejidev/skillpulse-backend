import mongoose, { Schema, Document } from "mongoose";

export interface IAICache extends Document {
  hash: string;
  
  userId: mongoose.Types.ObjectId;
  skillId: mongoose.Types.ObjectId;
  text: string;
  mood: string;
  reply?: string;
  createdAt: Date;
}

const aiCacheSchema = new Schema<IAICache>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", index: true },
    skillId: { type: Schema.Types.ObjectId, ref: "Skill", index: true },
    hash: { type: String, index: true },
    text: String,
    mood: String,
    reply: {
      type: String,
      default: null,
    },
  },
  { timestamps: true }
);

export default mongoose.model<IAICache>("AICache", aiCacheSchema);