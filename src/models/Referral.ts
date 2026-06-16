    // models/Referral.ts
    import mongoose, { Schema, Document } from "mongoose";

    export interface IReferral extends Document {
    code: string;                       // referrer’s code
    referrerId: mongoose.Types.ObjectId;
    referredUserId?: mongoose.Types.ObjectId;
    status: "clicked" | "signed_up" | "activated" | "rewarded";
    activationEvent?: string;          // e.g. "first_skill", "first_progress"
    createdAt: Date;
    updatedAt: Date;
    }

    const referralSchema = new Schema<IReferral>(
    {
        code: { type: String, required: true, index: true },
        referrerId: { type: Schema.Types.ObjectId, ref: "User", required: true },
        referredUserId: { type: Schema.Types.ObjectId, ref: "User" },
        status: {
        type: String,
        enum: ["clicked", "signed_up", "activated", "rewarded"],
        default: "clicked",
        },
        activationEvent: String,
    },
    { timestamps: true }
    );

    export default mongoose.model<IReferral>("Referral", referralSchema);