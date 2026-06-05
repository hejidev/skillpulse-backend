import mongoose, {
  Schema,
  Document,
} from "mongoose";

export interface ISystemMetric
  extends Document {

  cpuUsage: number;
  memoryUsage: number;
  diskUsage: number;

  apiLatency: number;

  requestsPerMinute: number;
  failedRequests: number;

  activeUsers: number;

  dbResponseTime: number;

  uptime: number;

  createdAt: Date;
}

const systemMetricSchema =
  new Schema<ISystemMetric>(
    {
      cpuUsage: Number,
      memoryUsage: Number,
      diskUsage: Number,

      apiLatency: Number,

      requestsPerMinute: Number,
      failedRequests: Number,

      activeUsers: Number,

      dbResponseTime: Number,

      uptime: Number,
    },
    {
      timestamps: true,
    }
  );

export default mongoose.model<ISystemMetric>(
  "SystemMetric",
  systemMetricSchema
);