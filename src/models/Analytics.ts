import mongoose, {
  Schema,
  Document,
} from "mongoose";

export interface IAnalyticsSnapshot
  extends Document {
  totalUsers: number;

  onlineUsers: number;

  activeUsers24h: number;

  newUsersToday: number;

  totalXP: number;

  totalSkills: number;

  totalActivities: number;

  aiRequests: number;

  threatsDetected: number;

  openTickets: number;

  resolvedTickets: number;

  averageSessionDuration: number;

  churnRiskUsers: number;

  engagedUsers: number;

  inactiveUsers: number;

  createdAt: Date;
}

const AnalyticsSnapshotSchema =
  new Schema(
    {
      totalUsers: Number,

      onlineUsers: Number,

      activeUsers24h: Number,

      newUsersToday: Number,

      totalXP: Number,

      totalSkills: Number,

      totalActivities: Number,

      aiRequests: Number,

      threatsDetected: Number,

      openTickets: Number,

      resolvedTickets: Number,

      averageSessionDuration: Number,

      churnRiskUsers: Number,

      engagedUsers: Number,

      inactiveUsers: Number,
    },
    {
      timestamps: true,
    }
  );

AnalyticsSnapshotSchema.index({
  createdAt: -1,
});

export default mongoose.model<IAnalyticsSnapshot>(
  "AnalyticsSnapshot",
  AnalyticsSnapshotSchema
);