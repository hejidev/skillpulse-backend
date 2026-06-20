// middleware/ip-blocker.ts
import { Request, Response, NextFunction } from "express";
import BlockedIp from "../models/BlockedIp";

let blockedCache = new Set<string>();
let lastLoadedAt = 0;
const CACHE_TTL_MS = 60_000; // 1 minute

async function refreshBlockedCache() {
    const now = Date.now();
    if (now - lastLoadedAt < CACHE_TTL_MS) return;
    const all = await BlockedIp.find().select("ip").lean();
    blockedCache = new Set(all.map((b) => b.ip));
    lastLoadedAt = now;
}

export const ipBlocker = async (req: Request, res: Response, next: NextFunction) => {
    try {
        // Skip public about route entirely
        if (req.originalUrl.startsWith("/api/auth") ||
            req.originalUrl.startsWith("/api/admin") ||
            req.originalUrl.startsWith("/api/dashboard") ||
            req.originalUrl.startsWith("/api/about") ||
            req.originalUrl.startsWith("/api/public-settings") ||
            req.originalUrl.startsWith("/api/billing/plans") ||
            req.originalUrl.startsWith("/api/blog") ||
            req.originalUrl.startsWith("/api/tickets") ||
            req.originalUrl.startsWith("/api/newsletter") ||
            req.originalUrl.startsWith("/api/referrals") ||
            req.originalUrl.startsWith("/api/search") ||
            req.originalUrl.startsWith("/api/me/devices") 
        ) {
            return next();
        }

        await refreshBlockedCache();

        const ip = (req.ip || "").replace("::ffff:", "");

        if (blockedCache.has(ip)) {
            return res.status(403).json({
                success: false,
                message: "Access denied from this IP address",
            });
        }

        if (blockedCache.has(ip)) {
            console.log("ipBlocker: blocking IP", ip, "for URL", req.originalUrl);
            return res.status(403).json({
                success: false,
                message: "Access denied from this IP address",
            });
        }

        next();
    } catch (err) {
        console.error("ipBlocker error:", err);
        next();
    }
};