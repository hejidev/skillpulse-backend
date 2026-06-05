import mongoose from "mongoose";

const achievementSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    key: { type: String, required: true },

    title: String,
    description: String,

    progress: { type: Number, default: 0 },
    unlocked: { type: Boolean, default: false },
    unlockedAt: Date,

    xpReward: { type: Number, default: 0 },
    level: {
      type: String,
      enum: ["bronze", "silver", "gold", "legendary"],
      default: "bronze",
    },
  },
  { timestamps: true }
);

achievementSchema.index({ userId: 1, key: 1 }, { unique: true });

export default mongoose.model("Achievement", achievementSchema);