// middleware/soc-monitor.middleware.ts
import { processThreatEvent } from "../services/system-alert.service";
import { isTrustedDevice } from "../utils/security";
import { AuthRequest } from "../types/express";

export const socMonitor = (req: AuthRequest, res: any, next: any) => {
  const start = Date.now();

  // Capture context you need *before* finish
  const userId = req.userId;              // set in isAuth middleware
  const deviceHash = (req as any).deviceHash; // however you attach it (e.g. from headers)

  res.on("finish", async () => {
    const duration = Date.now() - start;

    // Base severity for this event (example logic)
    let baseSeverity: "info" | "warning" | "danger" = "info";

    if (res.statusCode >= 500) {
      baseSeverity = "danger";
    } else if (res.statusCode === 401 || res.statusCode === 403) {
      baseSeverity = "warning";
    }

    const trusted = await isTrustedDevice(userId || "", deviceHash);

    const severity: "info" | "warning" | "danger" =
      trusted ? "info" : baseSeverity;

    // Example: log long-running requests with severity
    if (duration > 5000) {
      await processThreatEvent({
        type: "system_error",
        metadata: {
          path: req.path,
          method: req.method,
          duration,
        },
      });
    }

    if (res.statusCode >= 500) {
      await processThreatEvent({
        type: "system_error",
        metadata: {
          path: req.path,
          status: res.statusCode,
        },
      });
    }

    if (res.statusCode === 401) {
      await processThreatEvent({
        type: "auth_failure",
        metadata: {
          path: req.path,
          ip: req.ip,
        },
      });
    }
  });

  next();
};