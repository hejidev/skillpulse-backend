import si from "systeminformation";
import mongoose from "mongoose";
import os from "os";

import User from "../models/User";
import SystemMetric from "../models/SystemMetric";

import {
  totalRequests,
  failedRequests,
  totalLatency,
  resetRequestMetrics,
} from "../middleware/request-monitor";

export async function collectSystemMetrics() {

  try {

    /* ================= CPU ================= */

    const cpu =
      await si.currentLoad();

    /* ================= MEMORY ================= */

    const memory =
      await si.mem();

    /* ================= DISK ================= */

    const disks =
      await si.fsSize();

    /* ================= DB LATENCY ================= */

    const start =
      Date.now();

    const db =
      mongoose.connection.db;

    if (!db) {
      throw new Error(
        "MongoDB not connected"
      );
    }

    await db.admin().ping();

    const dbResponseTime =
      Date.now() - start;

    /* ================= USERS ================= */

    const activeUsers =
      await User.countDocuments({
        isOnline: true,
      });

    /* ================= API LATENCY ================= */

    const avgLatency =
      totalRequests > 0
        ? Math.round(
            totalLatency /
              totalRequests
          )
        : 0;

    /* ================= METRIC OBJECT ================= */

    const metric = {

      cpuUsage:
        Math.round(
          cpu.currentLoad
        ),

      memoryUsage:
        Math.round(
          ((memory.total -
            memory.available) /
            memory.total) *
            100
        ),

      diskUsage:
        Math.round(
          disks[0]?.use || 0
        ),

      apiLatency:
        avgLatency,

      requestsPerMinute:
        totalRequests,

      failedRequests,

      activeUsers,

      dbResponseTime,

      uptime:
        Math.floor(
          os.uptime() / 60
        ),
    };

    /* ================= SAVE ================= */

    await SystemMetric.create(metric);

    console.log(
      "✅ SYSTEM METRICS:",
      metric
    );

    /* ================= RESET ================= */

    resetRequestMetrics();

  } catch (error) {

    console.log(
      "SYSTEM METRICS ERROR:",
      error
    );

  }
}