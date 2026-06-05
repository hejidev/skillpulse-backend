import { Server } from "socket.io";

import AnalyticsSnapshot
  from "../models/Analytics";

import SystemMetric
  from "../models/SystemMetric";

export const analyticsSocket = (
  io: Server
) => {

  io.on(
    "connection",
    (socket) => {

      socket.on(
        "join-admin-analytics",
        async () => {

          socket.join(
            "admin-analytics"
          );

          const [
            analytics,
            metrics,
          ] = await Promise.all([
            AnalyticsSnapshot.findOne()
              .sort({
                createdAt: -1,
              }),

            SystemMetric.findOne()
              .sort({
                createdAt: -1,
              }),
          ]);

          socket.emit(
            "analytics:init",
            {
              cpuUsage: metrics?.cpuUsage || 0,
              memoryUsage: metrics?.memoryUsage || 0,
              diskUsage: metrics?.diskUsage || 0,
              apiLatency: metrics?.apiLatency || 0,
              requestsPerMinute:
                metrics?.requestsPerMinute || 0,
              failedRequests:
                metrics?.failedRequests || 0,
              activeUsers:
                metrics?.activeUsers || 0,
              dbResponseTime:
                metrics?.dbResponseTime || 0,
              uptime:
                metrics?.uptime || 0,

              analytics,
            }
          );
        }
      );
    }
  );
};

export const emitAnalyticsUpdate =
  async (
    io: Server
  ) => {

    const [
      analytics,
      metrics,
    ] = await Promise.all([
      AnalyticsSnapshot.findOne()
        .sort({
          createdAt: -1,
        }),

      SystemMetric.findOne()
        .sort({
          createdAt: -1,
        }),
    ]);

    io.to("admin-analytics").emit(
      "analytics:update",
      {
        // SYSTEM METRICS
        cpuUsage: metrics?.cpuUsage || 0,
        memoryUsage: metrics?.memoryUsage || 0,
        diskUsage: metrics?.diskUsage || 0,
        apiLatency: metrics?.apiLatency || 0,
        requestsPerMinute:
          metrics?.requestsPerMinute || 0,
        failedRequests:
          metrics?.failedRequests || 0,
        activeUsers:
          metrics?.activeUsers || 0,
        dbResponseTime:
          metrics?.dbResponseTime || 0,
        uptime:
          metrics?.uptime || 0,

        // ANALYTICS SNAPSHOT
        analytics,
      }
    );
  };