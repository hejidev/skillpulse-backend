import mongoose, { Schema, Document } from "mongoose";

export interface IApiKey extends Document {
  userId: mongoose.Types.ObjectId;
  name?: string;
  keyHash: string;        // hashed key
  prefix: string;         // e.g. "sk_live"
  lastFour: string;
  createdAt: Date;
  lastUsedAt?: Date;
  revokedAt?: Date;
}

const apiKeySchema = new Schema<IApiKey>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    name: { type: String },
    keyHash: { type: String, required: true, unique: true },
    prefix: { type: String, required: true },
    lastFour: { type: String, required: true },
    lastUsedAt: Date,
    revokedAt: Date,
  },
  { timestamps: { createdAt: true, updatedAt: true } }
);

export default mongoose.model<IApiKey>("ApiKey", apiKeySchema);