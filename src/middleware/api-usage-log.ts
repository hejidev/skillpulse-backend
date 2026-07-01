// middleware/api-usage-log.ts
import { Response, NextFunction } from "express";
import { ApiKeyRequest } from "./api-key-auth";
import SecurityLog from "../models/SecurityLog";

export const apiUsageLogger = (req: ApiKeyRequest, res: Response, next: NextFunction) => {
  const start = Date.now();
  const path = req.path;
  const method = req.method;

  const originalEnd = res.end;
  (res as any).end = function patchedEnd(chunk: any, encoding?: any) {
    const duration = Date.now() - start;

    // capture statusCode from res
    const status = res.statusCode;

    SecurityLog.create({
      userId: req.apiKeyUserId,
      action: `API Key Call ${method} ${path} [${status}]`,
      device: "api_client",
      ip: req.ip,
      severity: status >= 400 ? "warning" : "info",
      // If you extend SecurityLog schema, you can add fields like duration, apiKeyId, etc.
    }).catch((err) => {
      console.error("apiUsageLogger error:", err);
    });

    return originalEnd.call(this, chunk, encoding);
  };

  next();
};