import mongoose, { Schema, Document } from "mongoose";

export interface IProgress extends Document {
  userId: mongoose.Types.ObjectId;
  skillId: mongoose.Types.ObjectId;
  hours: number;
  xp: number;
  note?: string;
  createdAt: Date;
}

const progressSchema = new Schema<IProgress>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    skillId: { type: Schema.Types.ObjectId, ref: "Skill", required: true },
    hours: { type: Number, required: true },
    xp: { type: Number, required: true },
    note: String,
  },
  { timestamps: true }
);

export default mongoose.model<IProgress>("Progress", progressSchema);