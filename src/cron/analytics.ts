import cron from "node-cron";


import { io } from "../server";
import { buildRealtimeAnalytics } from "../lib/analytics/realtime-engine";
import { emitAnalyticsUpdate } from "../socket/analytics-socket";

cron.schedule(
  "*/1 * * * *",
  async () => {

    console.log(
      "📊 Realtime analytics engine running..."
    );

    try {

      const snapshot =
        await buildRealtimeAnalytics();

      await emitAnalyticsUpdate(
        io
      );

      console.log(
        "✅ Analytics snapshot updated"
      );

    } catch (error) {

      console.log(
        "❌ ANALYTICS CRON ERROR",
        error
      );
    }
  }
);