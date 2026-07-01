// middleware/api-key-auth.ts
import { Request, Response, NextFunction } from "express";
import crypto from "crypto";
import ApiKey from "../models/ApiKey";

function hashApiKey(key: string): string {
  return crypto.createHash("sha256").update(key).digest("hex");
}

export interface ApiKeyRequest extends Request {
  apiKeyUserId?: string;
  apiKeyId?: string;
}

export const apiKeyAuth = async (req: ApiKeyRequest, res: Response, next: NextFunction) => {
  try {
    const rawKey =
      (req.headers["x-api-key"] as string) ||
      (req.headers.authorization?.startsWith("ApiKey ")
        ? req.headers.authorization.slice("ApiKey ".length)
        : undefined);

    if (!rawKey) {
      return res.status(401).json({ message: "API key required" });
    }

    const keyHash = hashApiKey(rawKey);

    const keyDoc = await ApiKey.findOne({
      keyHash,
      revokedAt: { $exists: false },
    }).lean();

    if (!keyDoc) {
      return res.status(401).json({ message: "Invalid or revoked API key" });
    }

    // Attach info to req for downstream handlers
    req.apiKeyUserId = keyDoc.userId.toString();
    req.apiKeyId = keyDoc._id.toString();

    return next();
  } catch (err) {
    console.error("apiKeyAuth error:", err);
    return res.status(500).json({ message: "Failed to validate API key" });
  }
};