import mongoose, {
  Schema,
  Document,
} from "mongoose";

export interface IThreat
  extends Document {

  userId?:
    mongoose.Types.ObjectId;

  type: string;

  severity:
    | "low"
    | "medium"
    | "high"
    | "critical";

  score: number;

  ip?: string;

  device?: string;

  resolved: boolean;

  createdAt: Date;
}

const ThreatSchema =
  new Schema(
    {
      userId: {
        type:
          Schema.Types.ObjectId,

        ref: "User",
      },

      type: {
        type: String,

        required: true,
      },

      severity: {
        type: String,

        enum: [
          "low",
          "medium",
          "high",
          "critical",
        ],

        default: "low",
      },

      score: Number,

      ip: String,

      device: String,

      resolved: {
        type: Boolean,

        default: false,
      },
    },
    {
      timestamps: true,
    }
  );

ThreatSchema.index({
  severity: 1,
});

ThreatSchema.index({
  createdAt: -1,
});

export default mongoose.model<IThreat>(
  "Threat",
  ThreatSchema
);