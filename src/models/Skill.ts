// models/Skill.ts
import mongoose, { Schema, Document } from "mongoose";

export interface ISkill extends Document {
  userId: mongoose.Types.ObjectId;
  name: string;
  level: "Beginner" | "Intermediate" | "Advanced";
  xp: number;
  progress: number;
  totalHours: number;
  targetHours: number;
  progressLogs: { hours: number; createdAt: Date }[];
  createdAt: Date;
  updatedAt: Date;
}

const skillSchema = new Schema<ISkill>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    level: {
      type: String,
      enum: ["Beginner", "Intermediate", "Advanced"],
      default: "Beginner",
    },
    progress: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    totalHours: {
      type: Number,
      default: 0,
    },
    targetHours: {
      type: Number,
      default: 50,
    },
    xp: {
      type: Number,
      default: 0,
    },
  progressLogs: [
    {
      hours: {
        "type": Number,
        "required": true
      },
      "createdAt": {
        "type": Date,
        "default": Date.now
      }
    }
  ]
},
  { timestamps: true }
);

// Prevent duplicate skill names per user
skillSchema.index({ userId: 1, name: 1 }, { unique: true });

export default mongoose.model<ISkill>("Skill", skillSchema);