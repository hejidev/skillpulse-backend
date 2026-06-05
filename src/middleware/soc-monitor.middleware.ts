import { processThreatEvent } from "../services/system-alert.service";

export const socMonitor = (req: any, res: any, next: any) => {
  const start = Date.now();

  res.on("finish", async () => {
    const duration = Date.now() - start;

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
        severity: "high",
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